// src/api/geofence.js
import request from '@/utils/request'

// 新增地理围栏
export function saveGeofence(data) {
  return request({
    url: '/v1/geofence/save', //  这里要对应你后端 Controller 的路径
    method: 'post',
    data: data,
  })
}

// 如果你顺手把查询列表也写了，可以留着下面这个备用
export function getGeofenceList(params) {
  return request({
    url: '/v1/geofence/select',
    method: 'get',
    params: params,
  })
}
