const URLS = {
  auth: 'https://functions.poehali.dev/bd4069a9-7af4-40c7-bc6a-e4ba31e8b9a4',
  matrix: 'https://functions.poehali.dev/3f712f05-2123-4016-9d6c-398ffb7112ac',
  balance: 'https://functions.poehali.dev/4466c646-9adb-42c9-adf7-314bc4a3165d',
}

async function call(url: string, body: object) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const api = {
  register: (name: string, password: string, ref_code?: string) =>
    call(URLS.auth, { action: 'register', name, password, ref_code }),

  login: (name: string, password: string) =>
    call(URLS.auth, { action: 'login', name, password }),

  getUser: (user_id: number) =>
    call(URLS.auth, { action: 'get_user', user_id }),

  getTariffs: () =>
    call(URLS.matrix, { action: 'get_tariffs' }),

  buyTariff: (user_id: number, tariff_id: number) =>
    call(URLS.matrix, { action: 'buy_tariff', user_id, tariff_id }),

  getMyMatrices: (user_id: number) =>
    call(URLS.matrix, { action: 'get_my_matrices', user_id }),

  getMatrixDetail: (matrix_id: number) =>
    call(URLS.matrix, { action: 'get_matrix_detail', matrix_id }),

  getBalance: (user_id: number) =>
    call(URLS.balance, { action: 'get_balance', user_id }),

  requestWithdrawal: (user_id: number, amount: number, sbp_phone: string, sbp_bank: string) =>
    call(URLS.balance, { action: 'request_withdrawal', user_id, amount, sbp_phone, sbp_bank }),

  getTransactions: (user_id: number) =>
    call(URLS.balance, { action: 'get_transactions', user_id }),

  getReferrals: (user_id: number) =>
    call(URLS.balance, { action: 'get_referrals', user_id }),

  topupBalance: (user_id: number, amount: number, payment_id: string) =>
    call(URLS.balance, { action: 'topup_balance', user_id, amount, payment_id }),
}

export function getUser() {
  const str = localStorage.getItem('plyam_user')
  return str ? JSON.parse(str) : null
}

export function saveUser(user: object) {
  localStorage.setItem('plyam_user', JSON.stringify(user))
}

export function logout() {
  localStorage.removeItem('plyam_user')
}
