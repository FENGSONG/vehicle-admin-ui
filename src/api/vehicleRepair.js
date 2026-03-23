import request from '@/utils/request'

export function selectVehicleRepair(params) {
  return request({
    url: '/v1/vehicle-repair/select',
    method: 'get',
    params: params,
  })
}

export function saveVehicleRepair(data) {
  return request({
    url: '/v1/vehicle-repair/save',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  })
}

export function deleteVehicleRepair(id) {
  return request({
    url: `/v1/vehicle-repair/delete/${id}`,
    method: 'post',
  })
}
