import request from '@/utils/request'

export function selectVehicleInsurance(params) {
  return request({
    url: '/v1/vehicle-insurance/select',
    method: 'get',
    params: params,
  })
}

export function saveVehicleInsurance(data) {
  return request({
    url: '/v1/vehicle-insurance/save',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  })
}

export function deleteVehicleInsurance(id) {
  return request({
    url: `/v1/vehicle-insurance/delete/${id}`,
    method: 'post',
  })
}
