import request from '@/utils/request'

export function selectRole(params) {
  return request({
    url: '/v1/role/select',
    method: 'get',
    params: params,
  })
}

export function saveRole(data) {
  return request({
    url: '/v1/role/save',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  })
}

export function deleteRole(id) {
  return request({
    url: `/v1/role/delete/${id}`,
    method: 'post',
  })
}
