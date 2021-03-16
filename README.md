# Reply Guy AI

AI used to create replies for popular tweets from a user

Uses the [Twitter API](https://developer.twitter.com/en/docs/twitter-api) and [OpenAI](https://beta.openai.com/)

### To Run
1. Provide an `.env` file with a `TWITTER_BEARER_TOKEN` and an `OPENAI_KEY`
2. Run `yarn` or `npm install`
3. Run `node .` (you can add accounts as an array of objects into `run` in `index.js`)
  - `run([{ name: 'twitter', tweetId: '1370410960394067970' }])`
    - items without a `tweetId` value will default to the most recent tweet


## Difficulties
- Current setup only allows for tweets and replies within the last week
