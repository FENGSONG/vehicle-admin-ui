// 引入你项目中封装好的 axios 实例（路径可能根据你的实际项目结构略有不同，通常是 '@/utils/request'）
import request from '@/utils/request'

/**
 * 查询审批单列表数据
 * 对应后端: GET /v1/audit/select
 * @param {Object} params - 查询参数 (例如: { auditStatus: '10', keyword: 'xxx' })
 */
export function selectAuditList(params) {
  return request({
    url: '/v1/audit/select',
    method: 'get',
    params: params,
  })
}

/**
 * 审批申请单（同意/驳回）
 * 对应后端: POST /v1/audit/update
 * @param {Object} data - 提交的数据 (例如: { id: 1, applicationId: 2, auditStatus: '30', rejectReason: '...' })
 */
export function updateAuditStatus(data) {
  return request({
    url: '/v1/audit/update',
    method: 'post',
    // 💡 避坑提示：
    // 如果你的后端 Controller 中没有加 @RequestBody 注解，Spring 默认期望接收表单数据(form-data)。
    // 如果你在联调时发现后端接收到的参数全是 null，说明你需要以表单形式提交参数。
    // 可以将下面这行改为 params: data 或者使用 qs.stringify(data)
    data: data,
  })
}
