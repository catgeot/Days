// 유틸리티: 일일 무작위 셔플 (매일 달라지는 큐레이션)
export const getDailySeed = () => {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
};

export const shuffleWithSeed = (array, seed) => {
  let currentIndex = array.length, temporaryValue, randomIndex;
  let currentSeed = seed;
  const random = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };
  const result = [...array];
  while (0 !== currentIndex) {
    randomIndex = Math.floor(random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = result[currentIndex];
    result[currentIndex] = result[randomIndex];
    result[randomIndex] = temporaryValue;
  }
  return result;
};
