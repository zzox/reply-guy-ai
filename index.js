require('dotenv').config()
const { getUserTweets, getTweetResponses, sendPrompt } = require('./requests')
const { getRolloutIndex } = require('./utils')
const { formatAIPayload } = require('./ai')

const ONE_DAY = 1000 * 60 * 60 * 24
const ONE_WEEK = ONE_DAY * 7

// how many tweets to train with
const TRAINING_TWEETS = parseInt(process.env.TRAINING_TWEETS) || 5
// how much more retweets are valued than favs
const RETWEET_MULTIPLIER = parseInt(process.env.RETWEET_MULTIPLIER) || 1

// not always the best
const getGoodTweets = async (list, count, tweetId) => {
  let targetTweet
  if (!tweetId) {
    for (let i = 0; i < list.length; i++) {
      const item = list[i]

      if (item.full_text.slice(0, 4) !== 'RT @' &&
        !item.entities.media &&
        !item.quoted_status &&
        new Date(item.created_at).getTime() > Date.now() - ONE_WEEK) {
        tweetId = item.id_str
        targetTweet = item.full_text
        break
      }
    }
  } else {
    targetTweet = list.filter(item => item.id_str === tweetId)[0].full_text
  }

  if (!targetTweet) {
    throw new Error('No Target Tweet')
  }

  // exclude retweets, tweets with media or quote tweets
  // also tweets over a week old, since we can't get all replies on those
  const filtered = list
    .filter(item =>
      item.full_text.slice(0, 4) !== 'RT @' &&
      !item.entities.media &&
      !item.quoted_status &&
      item.id_str !== tweetId &&
      new Date(item.created_at).getTime() > Date.now() - ONE_WEEK
    ).sort((a, b) =>
      (b.retweet_count * RETWEET_MULTIPLIER + b.favorite_count) - (a.retweet_count * RETWEET_MULTIPLIER + a.favorite_count)
    )

  if (process.env.LOG_TRAINING_DATA) {
    console.info(`selecting from ${filtered.length} tweets that meet criteria`)
  }

  const selectedTweets = []
  for (let i = 0; i < count; i++) {
    if (!filtered.length) {
      break
    }

    const tweetList = filtered.map(tweet =>
      tweet.retweet_count * RETWEET_MULTIPLIER + tweet.favorite_count
    )
    const tweetIndex = getRolloutIndex(tweetList)
    const chosen = filtered.splice(tweetIndex, 1)[0]

    const replies = await getTweetResponses(chosen.id_str)

    if (replies.data) {
      const bestReply = getBestReply(replies.data, chosen.user.id_str)

      if (!bestReply) {
        i--
        continue
      }

      selectedTweets.push({
        text: chosen.full_text,
        reply: bestReply
      })
    } else {
      i--
      continue
    }
  }

  return { selectedTweets, targetTweet }
}

const getBestReply = (replies, userId) => {
  const filtered = replies.filter(item =>
    item.in_reply_to_user_id === userId
  )

  const tweetList = filtered.map(tweet =>
    tweet.public_metrics.retweet_count * RETWEET_MULTIPLIER + tweet.public_metrics.like_count
  )

  const sorted = filtered.sort((a, b) =>
    (b.public_metrics.retweet_count * RETWEET_MULTIPLIER + b.public_metrics.like_count) - (a.public_metrics.retweet_count * RETWEET_MULTIPLIER + a.public_metrics.like_count)
  )

  const tweetIndex = getRolloutIndex(tweetList)

  return formatReply(sorted.splice(tweetIndex, 1)[0].text)
}

// get rid of @'s in replies for sampling
const formatReply = (reply) => {
  let firstNonAt = false

  return reply
    .split(' ')
    .filter(word => {
      if (firstNonAt) {
        return true
      }

      if (word[0] !== '@') {
        firstNonAt = true
        return true
      }

      return false
    })
    .join(' ')
}

const run = async (accounts) => {
  for (var i = 0; i < accounts.length; i++) {
    const account = accounts[i]
    console.info(`Account: ${account.name}`)

    try {
      const userTweets = await getUserTweets(account.name)

      const { selectedTweets, targetTweet } = await getGoodTweets(userTweets, TRAINING_TWEETS, account.tweetId)

      if (!selectedTweets.length) {
        throw new Error('Not enough recent text tweets')
      }

      const prompt = formatAIPayload(selectedTweets, targetTweet)

      if (process.env.LOG_TRAINING_DATA) {
        console.info(prompt)
      }

      const result = await sendPrompt(prompt)

      if (process.env.NODE_ENV === 'production') {
        // TODO: tweet this reply, as long as we haven't replied to it
      } else {
        console.info(`Tweet: ${targetTweet}`)
        console.info(`Reply: ${result.choices[0].text.split('\n')[0]}`)
        console.info(`\n\n\n`)
      }
    } catch (e) {
      console.error(e)
    }
  }
}

// TODO: load data if there is any on these people, saved in .json afterwords
// save first tween when initiated
run([{ name: 'twitter', tweetId: '1370410960394067970' }])
