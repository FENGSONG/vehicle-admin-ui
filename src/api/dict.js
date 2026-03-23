import request from '@/utils/request'

export function selectDict(params) {
  return request({
    url: '/v1/dict/select',
    method: 'get',
    params: params,
  })
}

export function saveDict(data) {
  return request({
    url: '/v1/dict/save',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  })
}

export function deleteDict(id) {
  return request({
    url: `/v1/dict/delete/${id}`,
    method: 'post',
  })
}
