import request from '@/utils/request'

/**
 * 1. 用户登录
 * 后端有 @RequestBody，前端发送 JSON 格式
 */
export function login(data) {
  return request({
    url: '/v1/user/login',
    method: 'post',
    data: data,
  })
}

/**
 * 2. 查询用户
 * GET 请求，前端参数作为 query string 拼接到 URL 上
 */
export function selectUser(params) {
  return request({
    url: '/v1/user/select',
    method: 'get',
    params: params,
  })
}

/**
 * 3. 保存用户 (新增或修改)
 * ⚠️ 重点：后端没有 @RequestBody，采用表单数据格式(x-www-form-urlencoded)发送
 */
export function saveUser(data) {
  return request({
    url: '/v1/user/save',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  })
}

/**
 * 4. 重置密码
 * PathVariable 路径传参
 */
export function resetPassword(userId) {
  return request({
    url: `/v1/user/update/password/${userId}`,
    method: 'post',
  })
}

/**
 * 5. 修改状态
 * PathVariable 路径传参
 */
export function updateStatus(userId, status) {
  return request({
    url: `/v1/user/update/status/${userId}/${status}`,
    method: 'post',
  })
}

/**
 * 6. 删除用户
 * PathVariable 路径传参
 */
export function deleteUser(userId) {
  return request({
    url: `/v1/user/delete/${userId}`,
    method: 'post',
  })
}

/**
 * 7. 查询审批人列表
 * PathVariable 路径传参，GET 请求
 */
export function selectAuditList(parentId) {
  return request({
    url: `/v1/user/select/audit/${parentId}`,
    method: 'get',
  })
}
