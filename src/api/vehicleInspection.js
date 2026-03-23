import request from '@/utils/request'

export function selectVehicleInspection(params) {
  return request({
    url: '/v1/vehicle-inspection/select',
    method: 'get',
    params: params,
  })
}

export function saveVehicleInspection(data) {
  return request({
    url: '/v1/vehicle-inspection/save',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  })
}

export function deleteVehicleInspection(id) {
  return request({
    url: `/v1/vehicle-inspection/delete/${id}`,
    method: 'post',
  })
}
