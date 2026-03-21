import request from '@/utils/request'

// 1. 新增申请 (后端无 @RequestBody，使用表单格式提交)
export function saveApplication(data) {
  return request({
    url: '/v1/application/save',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  })
}

// 1.1 上传驾照图片
export function uploadLicense(fileFormData) {
  return request({
    url: '/v1/file/upload',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: fileFormData,
  })
}

// 2. 查询申请单列表
export function selectApplication(params) {
  return request({
    url: '/v1/application/select',
    method: 'get',
    params: params,
  })
}

// 3. 撤销申请
export function cancelApplication(id) {
  return request({
    url: `/v1/application/cancel/${id}`,
    method: 'post',
  })
}

// 4. 分配车辆
export function distributeVehicle(applicationId, vehicleId) {
  return request({
    url: `/v1/application/distribute/${applicationId}/${vehicleId}`,
    method: 'post',
  })
}

// 5. 还车
export function backVehicle(applicationId, vehicleId) {
  return request({
    url: `/v1/application/back/${applicationId}/${vehicleId}`,
    method: 'post',
  })
}
