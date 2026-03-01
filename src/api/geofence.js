import request from '@/utils/request'

// 1. 保存/新增地理围栏
export function saveGeofence(data) {
  return request({
    url: '/v1/geofence/save',
    method: 'post',
    data: data,
  })
}

// 2. 查询地理围栏列表 (对应后端的 @GetMapping("select"))
export function getGeofenceList(params) {
  return request({
    url: '/v1/geofence/select',
    method: 'get',
    params: params,
  })
}

// 3. 删除地理围栏 (对应后端的 @PostMapping("delete/{id}"))
export function deleteGeofence(id) {
  return request({
    url: `/v1/geofence/delete/${id}`,
    method: 'post',
  })
}
// 4. 修改地理围栏状态 (对应后端的 @PostMapping("update/{geofenceId}/{status}"))
export function updateGeofenceStatus(geofenceId, status) {
  return request({
    url: `/v1/geofence/update/${geofenceId}/${status}`,
    method: 'post',
  })
}
