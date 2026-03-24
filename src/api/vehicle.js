import request from '@/utils/request'

/**
 * 1. 查询车辆
 * GET 请求，参数通过 query string 拼接到 URL (params)
 */
export function selectVehicle(params) {
  return request({
    url: '/v1/vehicle/select',
    method: 'get',
    params: params,
  })
}

/**
 * 1.1 查询时间段内可分配车辆（后端按真实排班规则返回）
 */
export function selectAvailableVehicle(params) {
  return request({
    url: '/v1/vehicle/select/available',
    method: 'get',
    params: params,
  })
}

/**
 * 2. 保存车辆 (新增或修改)
 * ⚠️ 注意：后端没有使用 @RequestBody，因此需要将请求头设为 application/x-www-form-urlencoded
 */
export function saveVehicle(data) {
  return request({
    url: '/v1/vehicle/save',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  })
}

/**
 * 3. 删除车辆
 * PathVariable 路径传参
 */
export function deleteVehicle(id) {
  return request({
    url: `/v1/vehicle/delete/${id}`,
    method: 'post',
  })
}

/**
 * 4. 解绑车辆 (将车辆从围栏中移除)
 * PathVariable 路径传参
 */
export function unbindVehicle(vehicleId) {
  return request({
    url: `/v1/vehicle/unbind/${vehicleId}`,
    method: 'post',
  })
}

/**
 * 5. 绑定车辆 (将车辆绑定到指定围栏)
 * 包含两个 PathVariable 路径传参
 */
export function bindVehicle(geofenceId, vehicleId) {
  return request({
    url: `/v1/vehicle/bind/${geofenceId}/${vehicleId}`,
    method: 'post',
  })
}
