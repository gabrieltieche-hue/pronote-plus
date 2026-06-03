/**
 * Helpers pour le calcul et l'affichage des notes.
 * Tout est normalisé sur /20 pour la comparaison.
 */

/**
 * Normalise une note sur /20 si elle est sur un barème différent.
 * @param {number} value
 * @param {number} outOf
 * @returns {number|null}
 */
export function normalizeGrade(value, outOf) {
  if (value == null || !Number.isFinite(value)) return null
  if (!outOf || outOf === 20) return value
  return (value / outOf) * 20
}

/**
 * Calcule la moyenne pondérée d'un ensemble de notes.
 * Utilise la normalisation pour que les notes sur /40 comptent autant que sur /20.
 * @param {Array<{value: number|null, outOf?: number, coefficient: number}>} grades
 * @returns {number|null} moyenne sur /20
 */
export function calcSubjectAverage(grades) {
  if (!grades || grades.length === 0) return null
  let weightedSum = 0
  let coeffSum = 0
  for (const g of grades) {
    const n = normalizeGrade(g.value, g.outOf)
    if (n == null) continue
    const c = Number.isFinite(g.coefficient) && g.coefficient > 0 ? g.coefficient : 1
    weightedSum += n * c
    coeffSum += c
  }
  if (coeffSum === 0) return null
  return Math.round((weightedSum / coeffSum) * 100) / 100
}

/**
 * Calcule la moyenne générale pondérée par les coefficients des matières.
 * Les matières sans coefficient sont exclues.
 * @param {Array<{name: string, coefficient: number|null, grades: Array, studentAverage: number|null}>} subjects
 * @returns {number|null}
 */
export function calcOverallAverage(subjects) {
  if (!subjects || subjects.length === 0) return null
  let totalWeighted = 0
  let totalCoeff = 0
  for (const s of subjects) {
    if (s.coefficient == null || s.coefficient <= 0) continue
    const avg = s.studentAverage ?? calcSubjectAverage(s.grades)
    if (avg == null) continue
    totalWeighted += avg * s.coefficient
    totalCoeff += s.coefficient
  }
  if (totalCoeff === 0) return null
  return Math.round((totalWeighted / totalCoeff) * 100) / 100
}

/**
 * Compte le nombre total de notes sur l'ensemble des matières.
 */
export function calcTotalGradeCount(subjects) {
  return (subjects || []).reduce((acc, s) => acc + (s.grades?.length || 0), 0)
}

/**
 * Renvoie la classe CSS de couleur d'une note selon son ratio (sur /20).
 * @param {number|null} value
 * @param {number} [outOf=20]
 * @returns {'very-good'|'good'|'average'|'bad'|'very-bad'|''}
 */
export function getGradeColorClass(value, outOf = 20) {
  if (value == null || !Number.isFinite(value)) return ''
  const pct = outOf && outOf !== 20 ? value / outOf : value / 20
  if (pct >= 0.85) return 'very-good'
  if (pct >= 0.65) return 'good'
  if (pct >= 0.5) return 'average'
  if (pct >= 0.35) return 'bad'
  return 'very-bad'
}

/**
 * Renvoie le label textuel d'une classe de couleur.
 */
export function getGradeLabel(value, outOf = 20) {
  if (value == null) return '—'
  if (value >= 16) return 'Excellent'
  if (value >= 14) return 'Très bien'
  if (value >= 12) return 'Bien'
  if (value >= 10) return 'Assez bien'
  if (value >= 8) return 'Insuffisant'
  return 'Très insuffisant'
}

/**
 * Calcule la note minimale à obtenir au prochain devoir d'une matière donnée
 * pour atteindre une moyenne générale cible.
 *
 * Math (correcte) :
 * - Soit N la note du nouveau devoir, C_N son coefficient (≠ coefficient matière !)
 * - Pour la matière cible : avg_cible = (avg_actuelle * sum(coeffs existants) + N * C_N) / (sum(coeffs existants) + C_N)
 *   => N = (avg_cible * (sum(coeffs existants) + C_N) - avg_actuelle * sum(coeffs existants)) / C_N
 * - Pour les autres matières : leur contribution est figée
 * - Moyenne générale : (somme pondérée par coefficients des matières) / somme des coefficients
 *   => On part de la moyenne actuelle et on substitue la nouvelle matière
 *
 * @param {Array} subjects - toutes les matières
 * @param {number} subjectIndex - index de la matière cible
 * @param {number} targetAverage - objectif (sur /20)
 * @param {number} [newGradeCoeff=1] - coefficient du nouveau devoir (par défaut 1)
 * @returns {{needed: number, achievable: boolean, current: number, message: string}}
 */
export function calcNeededGrade(subjects, subjectIndex, targetAverage, newGradeCoeff = 1) {
  const target = Number(targetAverage)
  if (!Number.isFinite(target) || target < 0 || target > 20) {
    return { needed: null, achievable: false, current: null, message: 'Objectif invalide (0-20)' }
  }
  if (!Array.isArray(subjects) || subjects.length === 0 || subjectIndex < 0 || subjectIndex >= subjects.length) {
    return { needed: null, achievable: false, current: null, message: 'Matière invalide' }
  }
  const gc = Number.isFinite(newGradeCoeff) && newGradeCoeff > 0 ? newGradeCoeff : 1

  let sumWeighted = 0
  let sumCoeff = 0
  for (let i = 0; i < subjects.length; i++) {
    if (i === subjectIndex) continue
    const s = subjects[i]
    if (s.coefficient == null || s.coefficient <= 0) continue
    const avg = s.studentAverage ?? calcSubjectAverage(s.grades)
    if (avg == null) continue
    sumWeighted += avg * s.coefficient
    sumCoeff += s.coefficient
  }

  const targetSubject = subjects[subjectIndex]
  const subCoeff = targetSubject.coefficient
  const subAvg = targetSubject.studentAverage ?? calcSubjectAverage(targetSubject.grades)
  const subExistingCoeff = (targetSubject.grades || []).reduce(
    (acc, g) => acc + (Number.isFinite(g.coefficient) && g.coefficient > 0 ? g.coefficient : 1),
    0
  )

  // On veut : target = (sumWeighted + newSubjectWeighted) / (sumCoeff + subCoeff)
  // newSubjectWeighted = targetSubject.avg * subCoeff
  // = ((subAvg * subExistingCoeff) + (N * gc)) / (subExistingCoeff + gc) * subCoeff
  //
  // Soit x = subAvg * subExistingCoeff + N * gc
  //       y = subExistingCoeff + gc
  // target * (sumCoeff + subCoeff) = sumWeighted + (x / y) * subCoeff
  // (x / y) * subCoeff = target * (sumCoeff + subCoeff) - sumWeighted
  // x = (target * (sumCoeff + subCoeff) - sumWeighted) * y / subCoeff
  // N = (x - subAvg * subExistingCoeff) / gc

  if (subCoeff == null || subCoeff <= 0) {
    return { needed: null, achievable: false, current: subAvg, message: 'Matière sans coefficient' }
  }

  const targetSubjectContribution =
    (target * (sumCoeff + subCoeff) - sumWeighted) * (subExistingCoeff + gc) / subCoeff
  const numerator = targetSubjectContribution - subAvg * subExistingCoeff
  const needed = numerator / gc

  const rounded = Math.round(needed * 10) / 10
  const achievable = needed <= 20
  const alreadyMet = needed <= 0

  let message
  if (alreadyMet) {
    message = `T'as déjà ${subAvg != null ? subAvg.toFixed(1) : '—'}/20 de moyenne en ${targetSubject.name}. Objectif déjà atteint.`
  } else if (achievable) {
    message = `Il te faut ${rounded}/20 au prochain devoir en ${targetSubject.name} (coeff ${gc}) pour atteindre ${target}/20 de moyenne générale.`
  } else {
    message = `Même avec 20/20, l'objectif ${target}/20 est inatteignable. Le maximum est ${rounded}/20.`
  }

  return { needed: rounded, achievable, alreadyMet, current: subAvg, message }
}

/**
 * Tri des notes par date (du plus ancien au plus récent) pour affichage de tendances.
 */
export function sortGradesByDate(grades) {
  return [...(grades || [])].sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
}

/**
 * Groupe les notes par mois pour les graphiques de tendance.
 */
export function groupGradesByMonth(grades) {
  const groups = new Map()
  for (const g of grades || []) {
    if (!g.date) continue
    const d = new Date(g.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(g)
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, items]) => {
      const d = new Date(items[0].date)
      return {
        key,
        label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        average: calcSubjectAverage(items),
        count: items.length,
      }
    })
}
