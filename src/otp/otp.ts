import { APIError, randomSixDigits } from '../utils';
import type { OTP } from './types';

export class OTPService {

  generateOTP = async () => {
    let otp = randomSixDigits()
    return otp;
  }

  isExpired = (otp: OTP) => {
    const now = new Date();
    return otp.expiryDate <= now;
  }

  getExpiryDate = (duration: string) => {
    const now = new Date();
    const timeUnit = duration.slice(-1);
    const timeValue = parseInt(duration.slice(0, -1));

    if (isNaN(timeValue)) {
      throw new Error("Invalid duration value");
    }

    switch (timeUnit) {
      case 's': // seconds
        now.setSeconds(now.getSeconds() + timeValue);
        break;
      case 'm': // minutes
        now.setMinutes(now.getMinutes() + timeValue);
        break;
      case 'h': // hours
        now.setHours(now.getHours() + timeValue);
        break;
      case 'd': // days
        now.setDate(now.getDate() + timeValue);
        break;
      case 'w': // weeks
        now.setDate(now.getDate() + timeValue * 7);
        break;
      case 'M': // months
        now.setMonth(now.getMonth() + timeValue);
        break;
      case 'y': // years
        now.setFullYear(now.getFullYear() + timeValue);
        break;
      default:
        throw new APIError("Invalid duration unit", 500);
    }

    return now;

  }
}

export const otpService = new OTPService()