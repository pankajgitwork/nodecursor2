// utils/customDayJS.js
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

class customDayJS {
  constructor(date = null, tz = 'Asia/Kolkata') {
    if (date) {
      return dayjs(date).tz(tz)
    }
    return dayjs().tz(tz)
  }
}

export default customDayJS