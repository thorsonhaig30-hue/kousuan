export type QuestionType = 'add' | 'sub' | 'mul' | 'div';

export interface Question {
  id: string;
  type: QuestionType;
  operand1: number;
  operand2: number;
  operatorSymbol: string;
  answer: number;
  options: number[];
}

/**
 * Generates a single question based on the type, with results ≤ 100.
 */
export function generateQuestion(type: QuestionType, index: number): Question {
  let operand1 = 0;
  let operand2 = 0;
  let operatorSymbol = '';
  let answer = 0;

  switch (type) {
    case 'add': {
      // A + B = C, where C <= 100
      answer = Math.floor(Math.random() * 81) + 20; // Answer between 20 and 100
      operand1 = Math.floor(Math.random() * (answer - 5)) + 3; // First operand
      operand2 = answer - operand1;
      operatorSymbol = '+';
      break;
    }
    case 'sub': {
      // A - B = C, where A <= 100 and C >= 0
      operand1 = Math.floor(Math.random() * 81) + 20; // Min minuend 20, max 100
      answer = Math.floor(Math.random() * (operand1 - 2)) + 2; // Min answer 2
      operand2 = operand1 - answer;
      operatorSymbol = '-';
      break;
    }
    case 'mul': {
      // A * B = C, where C <= 100
      // Choose non-trivial factors, e.g., 2 to 12
      const factors: [number, number][] = [];
      for (let i = 2; i <= 15; i++) {
        for (let j = 2; j <= 12; j++) {
          if (i * j <= 100) {
            factors.push([i, j]);
          }
        }
      }
      const pair = factors[Math.floor(Math.random() * factors.length)];
      operand1 = pair[0];
      operand2 = pair[1];
      answer = operand1 * operand2;
      operatorSymbol = '×';
      break;
    }
    case 'div': {
      // A ÷ B = C, where A <= 100
      const divisions: [number, number][] = [];
      for (let divisor = 2; divisor <= 12; divisor++) {
        for (let quotient = 2; quotient <= 12; quotient++) {
          const dividend = divisor * quotient;
          if (dividend <= 100) {
            divisions.push([dividend, divisor]);
          }
        }
      }
      const pair = divisions[Math.floor(Math.random() * divisions.length)];
      operand1 = pair[0];
      operand2 = pair[1];
      answer = operand1 / operand2;
      operatorSymbol = '÷';
      break;
    }
  }

  // Generate 3 unique distractors near the correct answer
  const distractorSet = new Set<number>();
  
  // Potential offsets that make realistic mathematical sense (slight calculation errors)
  const offsets = [-1, 1, -2, 2, -10, 10, -5, 5];
  // Shuffle offsets to pick randomly
  const shuffledOffsets = [...offsets].sort(() => Math.random() - 0.5);

  for (const offset of shuffledOffsets) {
    const candidate = answer + offset;
    if (candidate > 0 && candidate !== answer && candidate <= 100) {
      distractorSet.add(candidate);
    }
    if (distractorSet.size === 3) break;
  }

  // Fallback if we didn't get enough unique positive distractors
  let attempts = 0;
  while (distractorSet.size < 3 && attempts < 100) {
    attempts++;
    const offset = Math.floor(Math.random() * 15) - 7;
    const candidate = answer + offset;
    if (candidate > 0 && candidate !== answer && candidate <= 100) {
      distractorSet.add(candidate);
    }
  }
  
  // Absolute fallback
  while (distractorSet.size < 3) {
    const randomNum = Math.floor(Math.random() * 100) + 1;
    if (randomNum !== answer) {
      distractorSet.add(randomNum);
    }
  }

  const options = [answer, ...Array.from(distractorSet)];
  // Shuffle options
  const shuffledOptions = options.sort(() => Math.random() - 0.5);

  return {
    id: `${type}-${index}-${Date.now()}`,
    type,
    operand1,
    operand2,
    operatorSymbol,
    answer,
    options: shuffledOptions,
  };
}

/**
 * Generates an entire set of 20 questions: 5 of each type, randomized.
 */
export function generateQuestionSet(): Question[] {
  const list: Question[] = [];
  
  // 5 of each
  for (let i = 0; i < 5; i++) {
    list.push(generateQuestion('add', i));
    list.push(generateQuestion('sub', i));
    list.push(generateQuestion('mul', i));
    list.push(generateQuestion('div', i));
  }

  // Shuffle the entire list so subjects are all mixed together beautifully
  return list.sort(() => Math.random() - 0.5);
}
