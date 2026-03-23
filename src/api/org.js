import request from '@/utils/request'

export function selectOrg(params) {
  return request({
    url: '/v1/org/select',
    method: 'get',
    params: params,
  })
}

export function saveOrg(data) {
  return request({
    url: '/v1/org/save',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  })
}

export function deleteOrg(id) {
  return request({
    url: `/v1/org/delete/${id}`,
    method: 'post',
  })
}
