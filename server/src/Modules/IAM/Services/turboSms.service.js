import axios from 'axios';
import crypto from 'crypto';

function getTurboSmsConfig() {
  return {
    url: process.env.TURBOSMS_API_URL || 'https://api.turbosms.ua/message/send.json',
    token: process.env.TURBOSMS_API_TOKEN || '',
    sender: process.env.TURBOSMS_SENDER || '',
    timeoutMs: Number(process.env.TURBOSMS_TIMEOUT_MS || 0),
  };
}

function isSuccessCode(code) {
  return [0, 800, 801, 802, 803].includes(Number(code));
}

function buildSequenceId(phone) {
  return `otp-${phone}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

async function sendOtpCode({ phone, code }) {
  const { url, token, sender, timeoutMs } = getTurboSmsConfig();

  if (!token) {
    const err = new Error('TurboSMS API token is not configured');
    err.statusCode = 503;
    err.code = 'SMS_PROVIDER_NOT_CONFIGURED';
    throw err;
  }

  if (!sender) {
    const err = new Error('TurboSMS sender is not configured');
    err.statusCode = 503;
    err.code = 'SMS_PROVIDER_NOT_CONFIGURED';
    throw err;
  }

  const recipient = String(phone || '').replace(/^\+/, '');
  const text = `Ваш код підтвердження: ${code}. Код дійсний 5 хв.`;
  const payload = {
    sequence_id: buildSequenceId(recipient),
    recipients: [recipient],
    sms: {
      sender,
      text,
    },
  };

  let response;

  try {
    response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...(timeoutMs > 0 ? { timeout: timeoutMs } : {}),
    });
  } catch (cause) {
    const err = new Error('Failed to send SMS code');
    err.statusCode = 502;
    err.code = 'SMS_PROVIDER_FAILED';
    err.details = {
      message: cause?.message || 'Unknown TurboSMS error',
    };
    throw err;
  }

  const data = response?.data || {};
  const responseCode = Number(data?.response_code);
  const responseStatus = String(data?.response_status || 'UNKNOWN');
  const firstResult = Array.isArray(data?.response_result) ? data.response_result[0] : null;

  if (!isSuccessCode(responseCode)) {
    const err = new Error('TurboSMS rejected SMS request');
    err.statusCode = 502;
    err.code = 'SMS_PROVIDER_REJECTED';
    err.details = {
      responseCode,
      responseStatus,
      providerResult: firstResult,
    };
    throw err;
  }

  if (firstResult && Number(firstResult.response_code) && !isSuccessCode(firstResult.response_code)) {
    const err = new Error('TurboSMS rejected recipient');
    err.statusCode = 502;
    err.code = 'SMS_PROVIDER_REJECTED';
    err.details = {
      responseCode: Number(firstResult.response_code),
      responseStatus: firstResult.response_status || 'UNKNOWN',
      providerResult: firstResult,
    };
    throw err;
  }

  return {
    provider: 'TurboSMS',
    responseCode,
    responseStatus,
    messageId: firstResult?.message_id || '',
  };
}

export const turboSmsService = {
  sendOtpCode,
};