import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AIRPORTS,
  analyzeRouteFares,
  buildComparisonSentence,
  calculateMedian,
  computeFareIndex,
  findBestDemoDate,
  formatINR,
  getDefaultTravelDate,
  getVerdictFromScore,
} from './fareLogic';

test('formatINR formats Indian Rupee values with en-IN grouping', () => {
  assert.equal(formatINR(5420), '₹5,420');
  assert.equal(formatINR(125000), '₹1,25,000');
  assert.equal(formatINR(950), '₹950');
  assert.equal(formatINR(-420), '-₹420');
});

test('calculateMedian computes exact median for odd and even arrays', () => {
  assert.equal(calculateMedian([5000, 3000, 4000]), 4000);
  assert.equal(calculateMedian([5000, 3000, 4000, 6000]), 4500);
});

test('computeFareIndex and getVerdictFromScore map thresholds accurately', () => {
  const lowScore = computeFareIndex(4400, 5200); // -15.4% -> BOOK NOW
  assert.ok(lowScore < 35, `Expected < 35, got ${lowScore}`);
  assert.equal(getVerdictFromScore(lowScore).label, 'BOOK NOW');

  const midScore = computeFareIndex(5200, 5200); // 0% -> WATCH
  assert.equal(midScore, 50);
  assert.equal(getVerdictFromScore(midScore).label, 'WATCH');

  const highScore = computeFareIndex(6200, 5200); // +19.2% -> WAIT
  assert.ok(highScore > 65, `Expected > 65, got ${highScore}`);
  assert.equal(getVerdictFromScore(highScore).label, 'WAIT');
});

test('buildComparisonSentence handles below, above, and equal-to-median cases', () => {
  assert.match(buildComparisonSentence(4500, 5000), /below the 30-day median/);
  assert.match(buildComparisonSentence(5600, 5000), /above the 30-day median/);
  assert.match(buildComparisonSentence(5000, 5000), /right in line with the 30-day median/);
});

test('analyzeRouteFares is deterministic and returns 38 chart points and 3 airlines', () => {
  const refToday = '2026-11-20';
  const chosenDate = getDefaultTravelDate(refToday); // 2026-12-04
  assert.equal(chosenDate, '2026-12-04');

  const runA = analyzeRouteFares('DEL', 'BOM', chosenDate, refToday);
  const runB = analyzeRouteFares('DEL', 'BOM', chosenDate, refToday);

  assert.deepEqual(runA, runB);
  assert.equal(runA.chartPoints.length, 38);
  assert.equal(runA.chartPoints[0].offsetFromChosen, -30);
  assert.equal(runA.chartPoints[30].offsetFromChosen, 0);
  assert.equal(runA.chartPoints[30].isChosenDate, true);
  assert.equal(runA.chartPoints[37].offsetFromChosen, 7);
  assert.equal(runA.chosenDayAirlines.length, 3);
  assert.equal(runA.chosenDayAirlines[0].isLowest, true);
  assert.equal(runA.chosenDayAirlines[0].fare, runA.todayLowestFare);
});

test('all 42 ordered pairings among the 7 airports return valid analyses without error', () => {
  const refToday = '2026-11-20';
  const chosenDate = '2026-12-04';
  let pairCount = 0;

  for (const from of AIRPORTS) {
    for (const to of AIRPORTS) {
      if (from.code === to.code) continue;
      pairCount++;
      const res = analyzeRouteFares(from.code, to.code, chosenDate, refToday);
      assert.ok(res.todayLowestFare >= 1500, `Unexpectedly low fare on ${from.code}-${to.code}`);
      assert.equal(res.chosenDayAirlines.length, 3);
      assert.equal(res.chartPoints.length, 38);
    }
  }
  assert.equal(pairCount, 42);
});

test('findBestDemoDate genuinely finds a BOOK NOW (score < 35) upcoming date for DEL -> BOM', () => {
  const testDates = ['2026-11-20', '2026-06-15', '2027-01-10'];
  for (const refToday of testDates) {
    const demo = findBestDemoDate('DEL', 'BOM', refToday);
    assert.equal(demo.origin.code, 'DEL');
    assert.equal(demo.destination.code, 'BOM');
    assert.ok(demo.fareIndex < 35, `Expected Demo Mode score < 35 on ${refToday}, got ${demo.fareIndex}`);
    assert.equal(demo.verdict.label, 'BOOK NOW');
    assert.ok(demo.todayLowestFare < demo.median30d);
    assert.ok(demo.daysUntilTravel >= 7);
  }
});

test('analyzeRouteFares rejects identical origin and destination', () => {
  assert.throws(() => analyzeRouteFares('DEL', 'DEL', '2026-12-04', '2026-11-20'), /different/);
});
