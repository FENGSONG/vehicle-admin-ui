import request from '@/utils/request'

export function selectDictOption(params) {
  return request({
    url: '/v1/dictoption/select',
    method: 'get',
    params: params,
  })
}

export function saveDictOption(data) {
  return request({
    url: '/v1/dictoption/save',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  })
}

export function deleteDictOption(id) {
  return request({
    url: `/v1/dictoption/delete/${id}`,
    method: 'post',
  })
}

export function selectDictOptionByCode(code) {
  return request({
    url: `/v1/dictoption/select/${code}`,
    method: 'get',
    ignoreBusinessCodes: [3002],
  })
}
