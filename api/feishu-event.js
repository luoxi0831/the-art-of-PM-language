const crypto = require('crypto');
const { getTenantAccessToken, polishText, FEISHU_APP_ID, FEISHU_APP_SECRET } = require('./_utils');
const axios = require('axios');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ msg: 'ok' });
  }

  const body = req.body;

  // 飞书URL验证
  if (body.type === 'url_verification') {
    return res.status(200).json({ challenge: body.challenge });
  }

  // 消息卡片回调
  if (body.header && body.header.event_type === 'card.action.trigger') {
    // 卡片按钮事件在 card_callback 中处理
    return res.status(200).json({});
  }

  // 事件回调
  if (body.header && body.header.event_type) {
    const eventType = body.header.event_type;

    // 消息快捷操作触发
    if (eventType === 'im.message.action.trigger_p2im_message_action_trigger_v1') {
      // 不做处理，用户通过H5页面交互
    }
  }

  return res.status(200).json({});
};
