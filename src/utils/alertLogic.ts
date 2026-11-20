import {
  AirportCode,
  analyzeRouteFares,
  getTodayISODate,
} from './fareLogic';

export interface FareAlert {
  id: string;
  origin: AirportCode;
  destination: AirportCode;
  travelDate: string;
  targetFare: number;
  notifyInApp: boolean;
  notifyEmail: boolean;
  email: string;
  createdAt: string;
}

export interface AlertEvaluation {
  alert: FareAlert;
  currentFare: number;
  median30d: number;
  isTriggered: boolean;
  differenceFromTarget: number; // currentFare - targetFare (<= 0 means met)
}

export interface AlertValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAlertInput(params: {
  origin: AirportCode;
  destination: AirportCode;
  travelDate: string;
  targetFare: number;
  notifyInApp: boolean;
  notifyEmail: boolean;
  email: string;
}): AlertValidationResult {
  const errors: string[] = [];

  if (params.origin === params.destination) {
    errors.push('Origin and destination airports must be different.');
  }

  if (!params.travelDate || !/^\d{4}-\d{2}-\d{2}$/.test(params.travelDate)) {
    errors.push('Please select a valid travel date.');
  }

  if (!Number.isFinite(params.targetFare) || params.targetFare < 500 || params.targetFare > 100000) {
    errors.push('Enter a target fare between ₹500 and ₹1,00,000.');
  }

  if (!params.notifyInApp && !params.notifyEmail) {
    errors.push('Select at least one notification method (In-app or Email).');
  }

  const trimmedEmail = params.email.trim();
  if (params.notifyEmail && trimmedEmail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.push('Enter a valid email address or leave the optional email field blank.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function evaluateAlert(
  alert: FareAlert,
  referenceToday: string = getTodayISODate(),
): AlertEvaluation {
  const analysis = analyzeRouteFares(
    alert.origin,
    alert.destination,
    alert.travelDate,
    referenceToday,
  );
  const currentFare = analysis.todayLowestFare;
  return {
    alert,
    currentFare,
    median30d: analysis.median30d,
    isTriggered: currentFare <= alert.targetFare,
    differenceFromTarget: currentFare - alert.targetFare,
  };
}

export function evaluateAllAlerts(
  alerts: FareAlert[],
  referenceToday: string = getTodayISODate(),
): {
  evaluations: AlertEvaluation[];
  triggered: AlertEvaluation[];
} {
  const evaluations = alerts.map((alert) => evaluateAlert(alert, referenceToday));
  const triggered = evaluations.filter((item) => item.isTriggered);
  return { evaluations, triggered };
}
