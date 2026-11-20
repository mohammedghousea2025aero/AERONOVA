import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAllAlerts, FareAlert, validateAlertInput } from './alertLogic';
import { analyzeRouteFares } from './fareLogic';

test('validateAlertInput catches same airport, missing channel, and invalid email', () => {
  const bad = validateAlertInput({
    origin: 'DEL',
    destination: 'DEL',
    travelDate: '2026-12-04',
    targetFare: 4500,
    notifyInApp: false,
    notifyEmail: false,
    email: '',
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.length >= 2);

  const badEmail = validateAlertInput({
    origin: 'DEL',
    destination: 'BOM',
    travelDate: '2026-12-04',
    targetFare: 4500,
    notifyInApp: true,
    notifyEmail: true,
    email: 'not-an-email',
  });
  assert.equal(badEmail.valid, false);

  const validOptionalEmail = validateAlertInput({
    origin: 'DEL',
    destination: 'BOM',
    travelDate: '2026-12-04',
    targetFare: 4500,
    notifyInApp: true,
    notifyEmail: true,
    email: '',
  });
  assert.equal(validOptionalEmail.valid, true);
});

test('evaluateAllAlerts flags alerts whose current sample fare is at or below target', () => {
  const refToday = '2026-11-20';
  const analysis = analyzeRouteFares('DEL', 'BOM', '2026-12-04', refToday);

  const alerts: FareAlert[] = [
    {
      id: 'a1',
      origin: 'DEL',
      destination: 'BOM',
      travelDate: '2026-12-04',
      targetFare: analysis.todayLowestFare + 500, // should trigger
      notifyInApp: true,
      notifyEmail: false,
      email: '',
      createdAt: refToday,
    },
    {
      id: 'a2',
      origin: 'DEL',
      destination: 'BOM',
      travelDate: '2026-12-04',
      targetFare: Math.max(500, analysis.todayLowestFare - 1000), // should not trigger
      notifyInApp: true,
      notifyEmail: true,
      email: 'traveler@example.com',
      createdAt: refToday,
    },
  ];

  const { evaluations, triggered } = evaluateAllAlerts(alerts, refToday);
  assert.equal(evaluations.length, 2);
  assert.equal(triggered.length, 1);
  assert.equal(triggered[0].alert.id, 'a1');
});
