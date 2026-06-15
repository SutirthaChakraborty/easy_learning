export function getWarriorBonus(timeTaken) {
  if (timeTaken === null || timeTaken === undefined) return 0;
  if (timeTaken <= 10) return 5;
  if (timeTaken <= 15) return 4;
  if (timeTaken <= 20) return 3;
  return 0;
}
