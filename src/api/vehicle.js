import request from '@/utils/request' // 引入网络请求工具

const BASE_URL = '/v1/vehicle'

/** 1. 查询车辆列表 */
export function selectVehicle(params) {
  return request({ url: `${BASE_URL}/select`, method: 'get', params })
}

/** 2. 保存车辆 (新增或更新) */
export function saveVehicle(data) {
  return request({ url: `${BASE_URL}/save`, method: 'post', data })
}

/** 3. 删除车辆 */
export function deleteVehicle(id) {
  return request({ url: `${BASE_URL}/delete/${id}`, method: 'post' })
}

/** 4. 解绑车辆 */
export function unbindVehicle(vehicleId) {
  return request({ url: `${BASE_URL}/unbind/${vehicleId}`, method: 'post' })
}

/** 5. 绑定车辆 */
export function bindVehicle(geofenceId, vehicleId) {
  return request({ url: `${BASE_URL}/bind/${geofenceId}/${vehicleId}`, method: 'post' })
}