import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';

import { execute, git } from './git';
import { requester } from './requester';
import { apis } from './youmed/api';

// -------------------------------------------------
const esDocId = 'roJQHHwB7mG-vl9dRvzY';
const sId = '41fc5730-a0d3-4fc0-beae-4eedf5ce4e8d';
const dayOfWeek = 5;
const dateFormatTemplate = 'YYYY-MM-DD';
// -------------------------------------------------

const { call: login } = requester.makeRequest(apis.login, false);
const { call: order } = requester.makeRequest(apis.order);
const { call: getInfo } = requester.makeRequest(apis.getInfo);
const { call: getWorkingDays } = requester.makeRequest(apis.getWorkingDays);
const { call: getWorkingSlots } = requester.makeRequest(apis.getWorkingSlots);

function getRecords() {
  const recordsFile = path.resolve('data', 'records.txt');
  return fs.readFileSync(recordsFile).toString().split('\n');
}

function setRecords(value: string) {
  const recordsFile = path.resolve('data', 'records.txt');
  return fs.writeFileSync(recordsFile, value);
}

(async function main() {
  const data = process.env.DATA;
  if (!data) {
    console.log('missing base64 encoded DATA');
    return;
  }

  const jsonString = Buffer.from(data, 'base64').toString('ascii');
  const futureDays = [1, 2, 3, 4].map((week) => {
    return dayjs().add(week, 'weeks').day(dayOfWeek).format(dateFormatTemplate);
  });
  const bookedDays = getRecords();
  const desiredDays = futureDays.filter((day) => bookedDays.indexOf(day) === -1);
  const { phoneNumber, password } = JSON.parse(jsonString) as { phoneNumber: string; password: string };
  const {
    result: { access_token },
  } = await login({ phoneNumber, password });

  requester.accessToken = access_token;

  const {
    result: { primaryPatientId },
  } = await getInfo();

  const {
    result: { workingDates },
  } = await getWorkingDays({
    esDocId,
    startDate: dayjs().format(dateFormatTemplate),
    endDate: dayjs().add(30, 'days').format(dateFormatTemplate),
  });

  const availabledDays = workingDates.filter(
    ({ workingDate, inactive }) => desiredDays.indexOf(workingDate) > -1 && inactive === false
  );

  if (availabledDays.length === 0) return;

  const newBookedDays = [];
  for (const day of availabledDays) {
    const {
      result: { slots },
    } = await getWorkingSlots({ sId, date: day.workingDate });
    const noonSlot = slots.find((slot) => slot.datePart === 'NOON');
    if (!noonSlot) continue;
    const firstMatchedSlot = noonSlot.appointmentSlots.find(({ slotStatus }) => slotStatus === 'AVAILABLE');
    if (!firstMatchedSlot) continue;

    console.log(`Matched slot in ${day.workingDate}:\n${JSON.stringify(firstMatchedSlot)}\n`);
    try {
      await order({ patientId: primaryPatientId, serviceId: sId, slotId: firstMatchedSlot.id });
      newBookedDays.push(day.workingDate);
    } catch (error) {
      console.log(error);
    }
  }

  if (newBookedDays.length == 0) return;

  setRecords([...bookedDays, ...newBookedDays].join('\n'));

  try {
    await execute('git', ['config', '--global', 'user.email', git.committerEmail]);
    await execute('git', ['config', '--global', 'user.name', git.committerUsername]);
    await execute('git', [
      'remote',
      'set-url',
      'origin',
      `https://x-access-token:${git.token}@${git.serverUrl.replace(/^https?:\/\//, '')}/${git.repository}.git`,
    ]);

    await execute('git', ['add', '.']);
    await execute('git', ['commit', '--allow-empty', '-m', `Add booked days (${newBookedDays.join(', ')})`]);
    await execute('git', ['push', 'origin', 'HEAD']);
  } catch (error) {
    console.log(error);
  }
})();
