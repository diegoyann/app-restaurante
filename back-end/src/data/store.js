export const db = {
  payrollSettings: {
    advancePercentage: 40,
    advanceDay: 15,
    advanceBusinessDayPolicy: 'previous',
    finalPaymentDay: 5,
    finalPaymentMonthOffset: 1,
    finalPaymentBusinessDayPolicy: 'previous',
    holidays: []
  },
  employees: [
    { id: 1, name: 'João da Massa', role: 'Esfiharia', salary: 2200 },
    { id: 2, name: 'Maria do Balcão', role: 'Atendimento', salary: 1800 }
  ]
};
