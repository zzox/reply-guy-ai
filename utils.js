// takes a list of numbers and returns an index based on
// proabability by item number
exports.getRolloutIndex = (list) => {
  const total = list.reduce((acc, cur) => acc + cur, 0)
  list.sort((a, b) => b - a)

  const randomNumber = Math.floor(Math.random() * total)

  let inc = list[0]
  let index = 0
  while (inc < total) {
    if (inc > randomNumber) {
      return index
    }

    inc += list[++index]
  }

  return null
}
