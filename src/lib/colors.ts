// Telegram-style peer palette: avatar gradients and sender-name colors.
export const PEER_GRADIENTS = [
  ['#ff885e', '#ff516a'],
  ['#ffcd6a', '#ffa85c'],
  ['#82b1ff', '#665fff'],
  ['#a0de7e', '#54cb68'],
  ['#53edd6', '#28c9b7'],
  ['#72d5fd', '#2a9ef1'],
  ['#e0a2f3', '#d669ed'],
]

export const NAME_COLORS_DARK = ['#ff7b8a', '#ffb65c', '#a99bff', '#7ee08b', '#5ce5d2', '#6ec3ff', '#e38dff']
export const NAME_COLORS_LIGHT = ['#d43b4f', '#d27a14', '#6d58e8', '#2e9a3e', '#16998a', '#1f84d6', '#b544cf']

export const peerGradient = (i: number) => {
  const [a, b] = PEER_GRADIENTS[((i % 7) + 7) % 7]
  return `linear-gradient(180deg, ${a}, ${b})`
}

export const nameColor = (i: number, theme: 'dark' | 'light') =>
  (theme === 'dark' ? NAME_COLORS_DARK : NAME_COLORS_LIGHT)[((i % 7) + 7) % 7]
