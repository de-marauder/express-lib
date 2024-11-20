import { Buffer } from 'buffer';

// Format the date as YYMMDD
export const formatDate = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}${month}${day}`;
}

// Generate a random 6-digit number
export const randomSixDigits = () => Math.floor(100000 + Math.random() * 900000).toString();

export const encodeBase64 = (data: string) => {
  const buffer = Buffer.from(data, 'utf-8');
  const base64String = buffer.toString('base64');
  return base64String;
}
