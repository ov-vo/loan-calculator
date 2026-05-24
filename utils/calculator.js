/**
 * 房贷计算器核心引擎
 * 支持等额本息、等额本金、组合贷款、提前还款、税费计算
 */

// ============ 基础工具 ============

/** 格式化金额（分位逗号） */
function formatMoney(num) {
  if (num == null || isNaN(num)) return '0'
  const n = Math.round(num * 100) / 100
  const parts = n.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

/** 格式化万 */
function formatWan(num) {
  if (num == null || isNaN(num)) return '0'
  const wan = (num / 10000).toFixed(2)
  return wan
}

/** 月利率 */
function monthlyRate(yearRate) {
  return yearRate / 100 / 12
}

// ============ 等额本息计算 ============

/**
 * 等额本息
 * 每月还款额 = [贷款本金 × 月利率 × (1+月利率)^还款月数] / [(1+月利率)^还款月数 - 1]
 * 总利息 = 每月还款额 × 还款月数 - 贷款本金
 */
function calcEqualPayment(principal, yearRate, years) {
  const months = years * 12
  const mr = monthlyRate(yearRate)
  
  let monthlyPayment = 0
  if (mr === 0) {
    monthlyPayment = principal / months
  } else {
    const pow = Math.pow(1 + mr, months)
    monthlyPayment = (principal * mr * pow) / (pow - 1)
  }

  let schedule = []
  let remaining = principal
  let totalInterest = 0
  let totalPaid = 0

  for (let i = 1; i <= months; i++) {
    const interest = remaining * mr
    const principalPaid = monthlyPayment - interest
    remaining -= principalPaid
    totalInterest += interest
    totalPaid += monthlyPayment

    schedule.push({
      period: i,
      monthlyPayment: monthlyPayment,
      principalPaid: principalPaid,
      interestPaid: interest,
      remainingPrincipal: Math.max(0, remaining),
      totalPaid: totalPaid,
      totalInterest: totalInterest
    })
  }

  return {
    monthlyPayment,
    totalPayment: totalPaid,
    totalInterest,
    months,
    schedule
  }
}

// ============ 等额本金计算 ============

/**
 * 等额本金
 * 每月还本金 = 贷款本金 / 还款月数
 * 每月利息 = 剩余本金 × 月利率
 * 每月还款额 = 每月还本金 + 每月利息
 */
function calcEqualPrincipal(principal, yearRate, years) {
  const months = years * 12
  const mr = monthlyRate(yearRate)
  const monthlyPrincipal = principal / months

  let schedule = []
  let remaining = principal
  let totalInterest = 0
  let totalPaid = 0

  let firstPayment = 0
  let lastPayment = 0

  for (let i = 1; i <= months; i++) {
    const interest = remaining * mr
    const payment = monthlyPrincipal + interest
    remaining -= monthlyPrincipal
    totalInterest += interest
    totalPaid += payment

    if (i === 1) firstPayment = payment
    if (i === months) lastPayment = payment

    schedule.push({
      period: i,
      monthlyPayment: payment,
      principalPaid: monthlyPrincipal,
      interestPaid: interest,
      remainingPrincipal: Math.max(0, remaining),
      totalPaid: totalPaid,
      totalInterest: totalInterest
    })
  }

  return {
    firstPayment,
    lastPayment,
    monthlyDecrease: (firstPayment - lastPayment) / (months - 1),
    monthlyPrincipal,
    totalPayment: totalPaid,
    totalInterest,
    months,
    schedule
  }
}

// ============ 组合贷款计算 ============

function calcCombined(commercialPrincipal, commercialRate, fundPrincipal, fundRate, years) {
  const commercial = calcEqualPayment(commercialPrincipal, commercialRate, years)
  const fund = calcEqualPayment(fundPrincipal, fundRate, years)

  const totalMonthly = commercial.monthlyPayment + fund.monthlyPayment
  const totalPayment = commercial.totalPayment + fund.totalPayment
  const totalInterest = commercial.totalInterest + fund.totalInterest
  const months = years * 12

  return {
    monthlyPayment: totalMonthly,
    totalPayment,
    totalInterest,
    commercial: {
      principal: commercialPrincipal,
      rate: commercialRate,
      monthlyPayment: commercial.monthlyPayment,
      totalInterest: commercial.totalInterest,
      totalPayment: commercial.totalPayment
    },
    fund: {
      principal: fundPrincipal,
      rate: fundRate,
      monthlyPayment: fund.monthlyPayment,
      totalInterest: fund.totalInterest,
      totalPayment: fund.totalPayment
    },
    months,
    years
  }
}

// ============ 提前还款计算 ============

/**
 * 提前还款计算
 * @param {number} principal - 原始贷款本金
 * @param {number} yearRate - 年利率
 * @param {number} years - 贷款年限
 * @param {number} paidMonths - 已还月数
 * @param {number} prepayAmount - 提前还款金额
 * @param {string} type - 'equal-payment' | 'equal-principal'
 * @param {string} prepayType - 'reduce-month' 缩短年限 | 'reduce-payment' 减少月供
 */
function calcPrepayment(principal, yearRate, years, paidMonths, prepayAmount, type, prepayType) {
  const totalMonths = years * 12
  let remainingPrincipal = 0
  let paidInterest = 0
  let monthlyPayment = 0

  if (type === 'equal-payment') {
    const mr = monthlyRate(yearRate)
    const pow = Math.pow(1 + mr, totalMonths)
    monthlyPayment = (principal * mr * pow) / (pow - 1)

    remainingPrincipal = principal
    for (let i = 1; i <= paidMonths; i++) {
      const interest = remainingPrincipal * mr
      const principalPaid = monthlyPayment - interest
      remainingPrincipal -= principalPaid
      paidInterest += interest
    }
  } else {
    // 等额本金
    const mr = monthlyRate(yearRate)
    const monthlyPrincipal = principal / totalMonths
    remainingPrincipal = principal - monthlyPrincipal * paidMonths
    for (let i = 1; i <= paidMonths; i++) {
      const interest = (principal - (i - 1) * monthlyPrincipal) * mr
      paidInterest += interest
    }
    monthlyPayment = 0 // 等额本金每月不同，此处不适用
  }

  // 提前还款后的剩余本金
  const newPrincipal = Math.max(0, remainingPrincipal - prepayAmount)
  const remainMonths = totalMonths - paidMonths

  let newResult = null

  if (prepayType === 'reduce-payment') {
    // 减少月供，年限不变
    const newYears = remainMonths / 12
    newResult = calcEqualPayment(newPrincipal, yearRate, newYears)
    newResult.type = 'reduce-payment'
    newResult.description = '减少月供，还款年限不变'
  } else {
    // 缩短年限，月供基本不变
    const mr = monthlyRate(yearRate)
    let newMonths = 0
    if (type === 'equal-payment' && monthlyPayment > 0) {
      // 保持原月供，计算新月数
      if (mr === 0) {
        newMonths = Math.ceil(newPrincipal / monthlyPayment)
      } else {
        newMonths = Math.ceil(
          Math.log(monthlyPayment / (monthlyPayment - newPrincipal * mr)) / Math.log(1 + mr)
        )
      }
    } else {
      // 等额本金：保持每月还本金额不变
      const monthlyPrin = principal / totalMonths
      newMonths = Math.ceil(newPrincipal / monthlyPrin)
    }
    newMonths = Math.max(1, Math.min(remainMonths, newMonths))
    const newYears2 = newMonths / 12
    newResult = calcEqualPayment(newPrincipal, yearRate, newYears2)
    newResult.type = 'reduce-month'
    newResult.description = '缩短还款年限，月供不变'
    newResult.newMonths = newMonths
  }

  const interestSaved = 
    (type === 'equal-payment' 
      ? calcEqualPayment(principal, yearRate, years)
      : calcEqualPrincipal(principal, yearRate, years)
    ).totalInterest - paidInterest - newResult.totalInterest

  return {
    originalPrincipal: principal,
    paidMonths,
    paidInterest,
    remainingBefore: remainingPrincipal,
    prepayAmount,
    remainingAfter: newPrincipal,
    newResult,
    interestSaved: Math.max(0, interestSaved),
    originalMonthlyPayment: monthlyPayment,
    newMonthlyPayment: newResult.monthlyPayment
  }
}

// ============ 税费计算 ============

/**
 * 购房税费计算
 * @param {object} params
 * @param {number} params.housePrice - 房屋总价
 * @param {number} params.area - 面积（平米）
 * @param {string} params.buyerType - 'first' | 'second' | 'third' 首套/二套/三套+
 * @param {string} params.houseType - 'normal' | 'non-normal' 普通/非普通住宅
 * @param {number} params.houseAge - 满几年（0=不满2年, 2=满2年, 5=满5年）
 * @param {boolean} params.isUnique - 是否唯一住房（卖房）
 * @param {number} params.originalPrice - 原值（用于个税差额计算）
 */
function calcTax(params) {
  const { housePrice, area, buyerType, houseType, houseAge, isUnique, originalPrice } = params
  let deedTax = 0
  let personalTax = 0
  let vat = 0
  let surtax = 0

  // 契税（买方承担）
  if (buyerType === 'first') {
    if (area <= 90) {
      deedTax = housePrice * 0.01  // 首套 ≤90平：1%
    } else {
      deedTax = housePrice * 0.015 // 首套 >90平：1.5%
    }
  } else if (buyerType === 'second') {
    if (area <= 90) {
      deedTax = housePrice * 0.01  // 二套 ≤90平（优惠）：1%
    } else {
      deedTax = housePrice * 0.02  // 二套 >90平：2%
    }
  } else {
    deedTax = housePrice * 0.03    // 三套及以上：3%
  }

  // 增值税及附加（卖方承担，但通常转嫁买方）
  const vatRate = 0.05
  const surtaxRate = 0.006 // 附加税 ≈ 增值税的12% = 总价 × 0.6%

  if (houseAge < 2) {
    // 不满2年：全额征收
    vat = housePrice / (1 + vatRate) * vatRate
    surtax = vat * 0.12
  } else {
    // 满2年
    if (houseType === 'normal') {
      vat = 0
      surtax = 0
    } else {
      // 非普通住宅：差额征收
      const diff = Math.max(0, housePrice - (originalPrice || 0))
      vat = diff / (1 + vatRate) * vatRate
      surtax = vat * 0.12
    }
  }

  // 个人所得税（卖方承担）
  if (houseAge >= 5 && isUnique) {
    personalTax = 0 // 满五唯一免征
  } else {
    // 可选：全额1% 或 差额20%
    const byTotal = housePrice * 0.01
    const diff = Math.max(0, housePrice - (originalPrice || 0) - vat - surtax)
    const byDiff = diff * 0.2
    personalTax = Math.min(byTotal, byDiff)
  }

  const buyerTotal = deedTax
  const sellerTotal = personalTax + vat + surtax
  const totalTax = buyerTotal + sellerTotal

  return {
    deedTax,
    personalTax,
    vat,
    surtax,
    buyerTotal,
    sellerTotal,
    totalTax,
    breakdown: [
      { name: '契税', amount: deedTax, bearer: '买方' },
      { name: '增值税', amount: vat, bearer: '卖方' },
      { name: '附加税', amount: surtax, bearer: '卖方' },
      { name: '个人所得税', amount: personalTax, bearer: '卖方' }
    ]
  }
}

// ============ 导出 ============

module.exports = {
  formatMoney,
  formatWan,
  calcEqualPayment,
  calcEqualPrincipal,
  calcCombined,
  calcPrepayment,
  calcTax
}
