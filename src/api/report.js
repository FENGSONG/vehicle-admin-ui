import request from '@/utils/request'

export function selectChargeByVehicle(params) {
  return request({
    url: '/v1/report/charge/vehicle',
    method: 'get',
    params,
  })
}

export function selectChargeByTime(params) {
  return request({
    url: '/v1/report/charge/time',
    method: 'get',
    params,
  })
}

export function selectTripByVehicle(params) {
  return request({
    url: '/v1/report/trip/vehicle',
    method: 'get',
    params,
  })
}

export function selectTripByTime(params) {
  return request({
    url: '/v1/report/trip/time',
    method: 'get',
    params,
  })
}

export function selectViolationByOwner(params) {
  return request({
    url: '/v1/report/violation/owner',
    method: 'get',
    params,
  })
}

export function selectViolationByTime(params) {
  return request({
    url: '/v1/report/violation/time',
    method: 'get',
    params,
  })
}

export function selectRepairByVehicle(params) {
  return request({
    url: '/v1/report/repair/vehicle',
    method: 'get',
    params,
  })
}

export function selectRepairByTime(params) {
  return request({
    url: '/v1/report/repair/time',
    method: 'get',
    params,
  })
}

export function selectYearlyVehicleFee(params) {
  return request({
    url: '/v1/report/yearly/vehicle-fee',
    method: 'get',
    params,
  })
}

export function selectYearlyTotalFee(params) {
  return request({
    url: '/v1/report/yearly/total-fee',
    method: 'get',
    params,
  })
}
