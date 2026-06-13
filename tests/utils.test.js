import assert from 'node:assert/strict'
import test from 'node:test'

import { calcSubjectAverage, calcOverallAverage, calcNeededGrade } from '../src/utils/grades.js'
import { getMondayOf, groupLessonsByDay, isSameDay } from '../src/utils/timetable.js'
import { formatDurationMinutes, totalAbsenceMinutes, totalUnjustifiedAbsences } from '../src/utils/vie-scolaire.js'

test('getMondayOf returns a new monday date without mutating input', () => {
  const input = new Date('2026-06-06T15:30:00.000Z')
  const before = input.toISOString()
  const monday = getMondayOf(input)

  assert.equal(input.toISOString(), before)
  assert.equal(monday.getDay(), 1)
  assert.equal(monday.getHours(), 0)
  assert.equal(monday.getMinutes(), 0)
})

test('groupLessonsByDay preserves sorted lessons per day', () => {
  const weekStart = getMondayOf(new Date('2026-06-01T12:00:00.000Z'))
  const lessons = [
    { subject: 'B', start: '2026-06-02T10:00:00.000Z', end: '2026-06-02T11:00:00.000Z' },
    { subject: 'A', start: '2026-06-02T08:00:00.000Z', end: '2026-06-02T09:00:00.000Z' },
  ]
  const { days, map } = groupLessonsByDay(lessons, weekStart, 5)
  const tuesday = days.find((day) => isSameDay(day, '2026-06-02T00:00:00.000Z'))

  assert.ok(tuesday)
  assert.deepEqual(map.get(tuesday.toDateString()).map((lesson) => lesson.subject), ['A', 'B'])
})

test('grade helpers normalize grades and compute weighted averages', () => {
  const subjects = [
    { coefficient: 2, studentAverage: null, grades: [{ value: 30, outOf: 40, coefficient: 1 }] },
    { coefficient: 1, studentAverage: 12, grades: [] },
  ]

  assert.equal(calcSubjectAverage(subjects[0].grades), 15)
  assert.equal(calcOverallAverage(subjects), 14)
})

test('overall average falls back to coefficient 1 when Pronote omits subject coefficients', () => {
  const subjects = [
    { coefficient: null, studentAverage: 18, grades: [] },
    { coefficient: undefined, studentAverage: 12, grades: [] },
  ]

  assert.equal(calcOverallAverage(subjects), 15)
})

test('calcNeededGrade handles already met and invalid targets', () => {
  const subjects = [
    { name: 'Maths', coefficient: 2, studentAverage: 15, grades: [{ value: 15, outOf: 20, coefficient: 1 }] },
  ]

  assert.equal(calcNeededGrade(subjects, 0, 25).message, 'Objectif invalide (0-20)')
  assert.equal(calcNeededGrade(subjects, 0, 14).needed, 13)
  assert.equal(calcNeededGrade(subjects, 0, 7).alreadyMet, true)
})

test('calcNeededGrade reports achievable max overall average, not impossible raw grade', () => {
  const subjects = [
    { name: 'Mathématiques', coefficient: null, studentAverage: 18.2, grades: [{ value: 18.2, outOf: 20, coefficient: 1 }] },
    { name: 'Français', coefficient: null, studentAverage: 11.8, grades: [{ value: 11.8, outOf: 20, coefficient: 1 }] },
  ]

  const result = calcNeededGrade(subjects, 0, 19, 1)

  assert.equal(result.achievable, false)
  assert.match(result.message, /maximum atteignable/)
  assert.doesNotMatch(result.message, /282\.2/)
})

test('vie scolaire duration and counters are stable', () => {
  const absences = [
    { justified: false, minutesMissed: 30 },
    { justified: true, hoursMissed: 1 },
  ]

  assert.equal(totalUnjustifiedAbsences(absences), 1)
  assert.equal(totalAbsenceMinutes(absences), 30)
  assert.equal(formatDurationMinutes(95), '1 h 35 min')
})
