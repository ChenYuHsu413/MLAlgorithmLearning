export const reportGuide = {
  modelingFlow: ['問題定義', '資料蒐集', '資料清理', '特徵工程', '訓練/驗證/測試切分', '模型訓練', '模型評估', '解釋與部署維護'],
  evaluationMap: [
    { task: '回歸', metrics: 'MAE、MSE、RMSE、R-squared、殘差圖' },
    { task: '分類', metrics: 'Accuracy、Precision、Recall、F1-score、ROC-AUC、PR-AUC' },
    { task: '分群', metrics: '群內距離、群間差異、Silhouette score、業務可解釋性' },
    { task: '降維', metrics: '解釋變異比例、重建誤差、視覺化合理性、後續任務表現' },
  ],
  selectionRules: [
    '先從簡單模型建立 baseline，再逐步增加複雜度。',
    '模型表現不好時，先檢查資料品質、特徵定義、切分方式與評估指標。',
    '模型表現異常好時，要懷疑資料洩漏或訓練/測試資料重複。',
    '線性模型、SVM、KNN、K-Means、PCA 通常需要標準化；樹模型通常較不依賴尺度。',
  ],
};
