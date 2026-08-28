export function isDatePickerDateDisabled(date: Date, allowFuture = false) {
  return (!allowFuture && date > new Date()) || date < new Date('1900-01-01')
}
