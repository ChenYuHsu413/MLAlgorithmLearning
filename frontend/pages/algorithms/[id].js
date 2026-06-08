import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reportInsights } from '../../lib/algorithmReport';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function AlgorithmPage() {
  const router = useRouter();
  const { id } = router.query;
  const [algorithm, setAlgorithm] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    setError('');
    fetch(`${API_BASE_URL}/api/algorithms/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('無法取得演算法資料');
        return res.json();
      })
      .then((data) => setAlgorithm(data))
      .catch((err) => {
        console.error(err);
        setError('目前無法讀取資料，請確認後端 API 是否已啟動。');
      });
  }, [id]);

  if (!id) return <p>載入中...</p>;
  if (error) return <p style={{ color: '#b00020' }}>{error}</p>;
  if (!algorithm) return <p>讀取資料中...</p>;

  const insight = reportInsights[algorithm.id];

  return (
    <main style={{ padding: '1rem', fontFamily: 'Arial', maxWidth: '800px', margin: 'auto' }}>
      <Link href="/" style={{ color: '#1f78b4' }}>
        返回列表
      </Link>
      <h1 style={{ marginTop: '1rem' }}>{algorithm.name}</h1>
      <section>
        <h3>說明</h3>
        <p>{algorithm.description}</p>
      </section>
      <section>
        <h3>範例</h3>
        <p>{algorithm.example}</p>
      </section>
      <section>
        <h3>優點</h3>
        <ul>
          {algorithm.advantages.map((adv, idx) => (
            <li key={idx}>{adv}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>缺點</h3>
        <ul>
          {algorithm.disadvantages.map((dis, idx) => (
            <li key={idx}>{dis}</li>
          ))}
        </ul>
      </section>
      {insight && (
        <section style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #dbe3ef', borderRadius: '8px', background: '#f8fafc' }}>
          <h2>PDF 研讀報告補充</h2>
          <p><strong>輸出型態：</strong>{insight.output}</p>
          <p>{insight.core}</p>
          <h3>建模流程</h3>
          <ol>
            {insight.workflow.map((item) => <li key={item}>{item}</li>)}
          </ol>
          <h3>評估指標</h3>
          <ul>
            {insight.metrics.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <h3>常見錯誤</h3>
          <ul>
            {insight.pitfalls.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <h3>實作練習</h3>
          <p>{insight.practice}</p>
        </section>
      )}
    </main>
  );
}
