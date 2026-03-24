import request from '@/utils/request'

// 1. 保存/新增电子围栏
export function saveGeofence(data) {
  return request({
    url: '/v1/geofence/save',
    method: 'post',
    data: data,
  })
}

// 2. 查询电子围栏列表
export function getGeofenceList(params) {
  return request({
    url: '/v1/geofence/select',
    method: 'get',
    params: params,
  })
}

// 3. 删除电子围栏
export function deleteGeofence(id) {
  return request({
    url: `/v1/geofence/delete/${id}`,
    method: 'post',
  })
}
// 4. 修改电子围栏状态
export function updateGeofenceStatus(geofenceId, status) {
  return request({
    url: `/v1/geofence/update/${geofenceId}/${status}`,
    method: 'post',
  })
}

// 5. 查询电子围栏告警记录
export function getGeofenceAlarmList(params) {
  return request({
    url: '/v1/geofence/alarm/select',
    method: 'get',
    params,
  })
}

// 6. 车辆位置上报（触发电子围栏告警判定）
export function reportGeofencePosition(data) {
  return request({
    url: '/v1/geofence/alarm/report',
    method: 'post',
    data,
  })
}
