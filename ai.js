// take tweets and replies and format the payload
exports.formatAIPayload = (selectedTweets, targetTweet) => {
  const prompt = []

  for (let i = 0; i < selectedTweets.length; i++) {
    const selected = selectedTweets[i]

    prompt.push(`Statement: ${selected.text}`)
    prompt.push(`Reply: ${selected.reply}`)
    prompt.push(`###`)
  }

  prompt.push(`Statement: ${targetTweet}`)
  prompt.push('Reply: ')

  return prompt.join('\n')
}
