import request from '@/utils/request'

export function selectDictOptionByCode(code) {
  return request({
    url: `/v1/dictoption/select/${code}`,
    method: 'get',
    ignoreBusinessCodes: [3002],
  })
}
