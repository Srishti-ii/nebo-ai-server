function leadScorer(lead) {

  let score = 0;

  if (lead.industry)
    score += 10;

  if (lead.company)
    score += 10;

  if (lead.budget) {

    const budget =
      Number(
        lead.budget
          .replace(/[^0-9]/g, "")
      );

    if (budget >= 1000)
      score += 10;

    if (budget >= 5000)
      score += 20;

    if (budget >= 10000)
      score += 30;
  }

  if (lead.timeline) {

    const days =
      parseInt(
        lead.timeline
      );

    if (days <= 90)
      score += 15;

    if (days <= 30)
      score += 25;
  }

  return score;
}

module.exports =
leadScorer;