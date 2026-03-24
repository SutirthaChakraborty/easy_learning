# Animation Assets (Lottie)

Place Lottie JSON animation files here.

## Required Files

| File | Purpose | Notes |
| --- | --- | --- |
| `mascot.json` | Main hero mascot character | Looping idle animation |
| `level-up.json` | Level-up celebration | One-shot burst |
| `badge.json` | Badge unlock popup | One-shot |
| `confetti.json` | Confetti shower | One-shot |
| `star-pop.json` | XP star pop effect | One-shot |

## Finding Free Lottie Files

- [LottieFiles Featured](https://lottiefiles.com/featured) — search "character", "kid", "celebration"
- [Icons8 Animated Icons](https://icons8.com/animated-icons)
- Make your own in [LottieFiles Creator](https://lottiefiles.com/create)

## Guidelines

- Use `.json` format (standard Lottie) or `.lottie` (compressed dotLottie)
- Keep each file < 100KB for performance
- Prefer simple, colourful, child-friendly styles
- Test rendering in [LottieFiles Preview](https://lottiefiles.com/preview)

## Integration (Already set up in index.html)

```javascript
lottie.loadAnimation({
  container : document.getElementById('lottie-mascot'),
  renderer  : 'svg',
  loop      : true,
  autoplay  : true,
  path      : 'assets/animations/mascot.json',
});
```
