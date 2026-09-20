/**
 * 명소 세권(중분류) SSOT — areaCode → clusters[{ id, label, hubIds }]
 * 편집 후: npm run generate:korea-scenic-clusters && npm run audit:korea-scenic-clusters
 *
 * 합의: plans/korea-scenic-mid-cluster-plan.md (경기 동서남북 · 타 시도 실제 분류)
 */
export const KOREA_SCENIC_CLUSTER_OVERRIDES = {
  meta: { version: 1 },
  areas: {
    // 경기 — 동·서·남·북
    31: {
      clusters: [
        {
          id: 'gg-north',
          label: '북부',
          hubIds: [
            'goyang',
            'paju',
            'uijeongbu',
            'yangju',
            'dongducheon',
            'pocheon',
            'yeoncheon',
          ],
        },
        {
          id: 'gg-east',
          label: '동부',
          hubIds: [
            'hanam',
            'namyangju',
            'guri',
            'gapyeong',
            'yangpyeong',
            'yeoju',
            'icheon',
            'gwangju_gi',
          ],
        },
        {
          id: 'gg-west',
          label: '서부',
          hubIds: [
            'gimpo',
            'bucheon',
            'gwangmyeong',
            'siheung',
            'ansan',
            'hwaseong',
            'pyeongtaek',
          ],
        },
        {
          id: 'gg-south',
          label: '남부',
          hubIds: [
            'suwon',
            'seongnam',
            'yongin',
            'anyang',
            'gunpo',
            'uiwang',
            'gwacheon',
            'osan',
            'anseong',
          ],
        },
      ],
    },
    // 강원 — 영서·영동·접경·산간
    32: {
      clusters: [
        {
          id: 'gw-yeongseo',
          label: '영서',
          hubIds: ['chuncheon', 'hongcheon', 'hoengseong', 'wonju'],
        },
        {
          id: 'gw-yeongdong',
          label: '영동',
          hubIds: [
            'gangneung',
            'sokcho',
            'yangyang',
            'goseong',
            'donghae',
            'samcheok',
          ],
        },
        {
          id: 'gw-border',
          label: '접경',
          hubIds: ['cheorwon', 'hwacheon', 'yanggu', 'inje'],
        },
        {
          id: 'gw-sangan',
          label: '산간',
          hubIds: ['pyeongchang', 'jeongseon', 'yeongwol', 'taebaek'],
        },
      ],
    },
    // 충북 — 청주권·북부·남부
    33: {
      clusters: [
        {
          id: 'cb-cheongju',
          label: '청주권',
          hubIds: [
            'cheongju',
            'jincheon',
            'jeungpyeong',
            'eumseong',
            'goesan',
          ],
        },
        {
          id: 'cb-north',
          label: '북부',
          hubIds: ['chungju', 'jecheon', 'danyang'],
        },
        {
          id: 'cb-south',
          label: '남부',
          hubIds: ['boeun', 'okcheon', 'yeongdong'],
        },
      ],
    },
    // 충남 — 북부·서해·내포·백제·내륙
    34: {
      clusters: [
        {
          id: 'cn-north',
          label: '북부',
          hubIds: ['cheonan', 'asan', 'dangjin'],
        },
        {
          id: 'cn-west',
          label: '서해',
          hubIds: ['seosan', 'taean', 'boryeong', 'seocheon'],
        },
        {
          id: 'cn-naepo',
          label: '내포',
          hubIds: ['hongseong', 'yesan', 'cheongyang'],
        },
        {
          id: 'cn-baekje',
          label: '백제·내륙',
          hubIds: ['gongju', 'buyeo', 'nonsan', 'gyeryong', 'geumsan'],
        },
      ],
    },
    // 전북 — 전주권·서부·동부
    37: {
      clusters: [
        {
          id: 'jb-jeonju',
          label: '전주권',
          hubIds: ['jeonju', 'wanju', 'iksan', 'gimje'],
        },
        {
          id: 'jb-west',
          label: '서부',
          hubIds: ['gunsan', 'buan', 'gochang', 'jeongeup'],
        },
        {
          id: 'jb-east',
          label: '동부',
          hubIds: [
            'namwon',
            'muju',
            'jinan',
            'jangsu',
            'imsil',
            'sunchang',
          ],
        },
      ],
    },
    // 전남 — 동·북·서·중남
    38: {
      clusters: [
        {
          id: 'jn-east',
          label: '동부',
          hubIds: ['yeosu', 'suncheon', 'gwangyang', 'gurye', 'gokseong'],
        },
        {
          id: 'jn-north',
          label: '북부',
          hubIds: [
            'naju',
            'damyang',
            'jangseong',
            'hwasun',
            'hampyeong',
            'yeonggwang',
          ],
        },
        {
          id: 'jn-west',
          label: '서부',
          hubIds: ['mokpo', 'muan', 'sinan', 'jindo', 'haenam', 'wando'],
        },
        {
          id: 'jn-mid',
          label: '중남',
          hubIds: [
            'gangjin',
            'jangheung',
            'boseong',
            'goheung',
            'yeongam',
          ],
        },
      ],
    },
    // 경북 — 신라·가야·낙동·유교·북부·산간·동해
    35: {
      clusters: [
        {
          id: 'gb-silla',
          label: '신라',
          hubIds: [
            'gyeongju',
            'pohang',
            'gyeongsan',
            'yeongcheon',
            'cheongdo',
          ],
        },
        {
          id: 'gb-gaya',
          label: '가야·낙동',
          hubIds: [
            'goryeong',
            'sangju',
            'chilgok',
            'gumi',
            'gimcheon',
            'seongju',
          ],
        },
        {
          id: 'gb-confucian',
          label: '유교·북부',
          hubIds: [
            'andong',
            'yeongju',
            'yecheon',
            'mungyeong',
            'uiseong',
            'gunwi',
          ],
        },
        {
          id: 'gb-mountain',
          label: '산간·동해',
          hubIds: [
            'bonghwa',
            'yeongyang',
            'cheongsong',
            'yeongdeok',
            'uljin',
            'ulleung',
            'dokdo',
          ],
        },
      ],
    },
    // 경남 — 남해안·지리산·낙동
    36: {
      clusters: [
        {
          id: 'gn-coast',
          label: '남해안',
          hubIds: [
            'changwon',
            'tongyeong',
            'geoje',
            'sacheon',
            'goseongnam',
            'namhae',
            'hadong',
          ],
        },
        {
          id: 'gn-jiri',
          label: '지리산·서부',
          hubIds: [
            'jinju',
            'sancheong',
            'hamyang',
            'geochang',
            'hapcheon',
          ],
        },
        {
          id: 'gn-nakdong',
          label: '낙동·중부',
          hubIds: [
            'gimhae',
            'yangsan',
            'miryang',
            'uiryeong',
            'haman',
            'changnyeong',
          ],
        },
      ],
    },
  },
};
