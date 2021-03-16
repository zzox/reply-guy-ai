const fetch = require('node-fetch')

const twitterHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
}

const TWITTER_URL = 'https://api.twitter.com'
const OPENAI_URL = 'https://api.openai.com/v1/engines/davinci/completions'

const handleResponse = (res) => res.ok ? res.json() : res.json().then(it => Promise.reject(it))

/** TWITTER **/
exports.getUserTweets = (user) =>
  fetch(`${TWITTER_URL}/1.1/statuses/user_timeline.json?exclude_replies=1&count=200&include_rts=1&tweet_mode=extended&screen_name=${user}`, {
    headers: twitterHeaders
  }).then(handleResponse)

exports.getTweetResponses = (tweetId) =>
  // fetch(`${TWITTER_URL}/2/tweets?ids=${tweetId}&tweet.fields=author_id,conversation_id,created_at,in_reply_to_user_id,referenced_tweets&expansions=author_id,in_reply_to_user_id,referenced_tweets.id&user.fields=name,username`, {
  fetch(`${TWITTER_URL}/2/tweets/search/recent?query=conversation_id:${tweetId}&max_results=100&tweet.fields=in_reply_to_user_id,author_id,created_at,conversation_id,public_metrics`, {
    headers: twitterHeaders
  }).then(handleResponse)

/** OPENAI **/
exports.sendPrompt = (prompt) =>
  fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_KEY}`
    },
    body: JSON.stringify({
      prompt,
      temperature: 0.1,
      max_tokens: 64
    })
  }).then(handleResponse)
