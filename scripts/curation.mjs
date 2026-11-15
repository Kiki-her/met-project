/**
 * 展覧会のキュレーション定義。
 * 作品は The Met Collection（Open Access / CC0）の objectID で指定する。
 * ビルド時に scripts/build-data.mjs が実データと突き合わせて検証する。
 *
 * 1展覧会 = 4章 × 4〜6点（計17点）。章は順路の単位で、
 * 壁に章題が立ち、章ごとに短い解説が付く。
 */
export const exhibitions = [
  {
    id: "nocturnes",
    title: { ja: "夜想曲", en: "Nocturnes" },
    subtitle: { ja: "光が消えていく時間", en: "The hour when light leaves" },
    curator: {
      ja: "夜の絵画は、暗さを描くのではなく、暗さの中に残るわずかな光を描いています。月、蝋燭、そして沈みかけた太陽。声を落として、順路を進んでください。",
      en: "Night paintings are not pictures of darkness. They are pictures of the little light that darkness leaves behind — moon, candle, and a sun already going down. Lower your voice and walk on.",
    },
    cover: 438417,
    chapters: [
      {
        title: { ja: "月の下で", en: "Under the Moon" },
        note: {
          ja: "月は絵の中の唯一の光源です。人物は背を向け、こちらではなく空を見ています。",
          en: "The moon is the only source of light in the room. The figures turn their backs and look up, not at us.",
        },
        works: [438417, 441769, 11127, 11979],
      },
      {
        title: { ja: "月光の港", en: "Moonlit Harbor" },
        note: {
          ja: "月が水面に落ちると、港はもう別の場所になります。帆も、岸も、同じ色に沈みます。",
          en: "Once the moon reaches the water, a harbor becomes somewhere else. Sails and shore sink into the same colour.",
        },
        works: [437979, 439343, 788905, 436632],
      },
      {
        title: { ja: "灯をともす", en: "Kindling a Light" },
        note: {
          ja: "月が遠い光なら、蝋燭は手の届く光です。炎のまわりの闇は、いちばん濃い闇です。",
          en: "If moonlight is distant, candlelight is within reach. The dark around a flame is the densest dark there is.",
        },
        works: [436839, 13269, 11230, 10183, 437189],
      },
      {
        title: { ja: "沈む光", en: "The Sinking Light" },
        note: {
          ja: "夕暮れは、昼でも夜でもない時間。画家たちはこの数分のために何枚も画布を使いました。",
          en: "Twilight belongs to neither day nor night. Painters spent canvas after canvas on those few minutes.",
        },
        works: [11325, 436455, 11328, 436833],
      },
    ],
  },
  {
    id: "sea-and-light",
    title: { ja: "海と光", en: "Sea and Light" },
    subtitle: { ja: "水平線の向こう側", en: "Beyond the horizon line" },
    curator: {
      ja: "海は、光をいちばん正直に写す鏡です。曇天、嵐の前、真夜中の月光。19世紀の画家たちは海の前で、空の色を描くことを学びました。",
      en: "The sea is the most honest mirror light has. Overcast, before a storm, in moonlight: standing before the water, nineteenth-century painters learned to paint the sky.",
    },
    cover: 11122,
    chapters: [
      {
        title: { ja: "荒れる海", en: "The Restless Sea" },
        note: {
          ja: "波は人間を飲み込みます。ここでは海が主役で、人は小さな出来事にすぎません。",
          en: "The waves swallow people whole. Here the sea is the subject and the human is an incident.",
        },
        works: [11122, 11130, 11050, 10554],
      },
      {
        title: { ja: "港", en: "Harbors" },
        note: {
          ja: "港は、海と陸が交渉する場所です。帆を上げる者、網を引く者、砲を向ける者。",
          en: "A harbor is where sea and land negotiate. Someone raises sail, someone hauls nets, someone aims a gun.",
        },
        works: [437103, 437886, 437587, 437854],
      },
      {
        title: { ja: "静かな入り江", en: "The Quiet Cove" },
        note: {
          ja: "嵐のあとには、水が鏡になります。帆は垂れ、音は水面に吸い込まれます。",
          en: "After the storm the water turns to glass. Sails hang slack; sound is absorbed by the surface.",
        },
        works: [11307, 11396, 10464, 11981, 13001],
      },
      {
        title: { ja: "ひかりの海", en: "A Sea of Light" },
        note: {
          ja: "水平線だけの絵があります。描かれているのは場所ではなく、光そのものです。",
          en: "Some of these are almost nothing but a horizon. What is painted is not a place but light itself.",
        },
        works: [437430, 10480, 10207, 437975],
      },
    ],
  },
  {
    id: "quiet-interiors",
    title: { ja: "室内の静けさ", en: "Quiet Interiors" },
    subtitle: { ja: "部屋という小さな世界", en: "The room as a small world" },
    curator: {
      ja: "扉の向こうの部屋には、いつも少し遅れた時間が流れています。読む人、待つ人、弾く人。私たちはその数秒を、戸口から覗いています。",
      en: "Time runs slightly late in a room behind a door. Someone reading, someone waiting, someone playing. We are watching those few seconds from the threshold.",
    },
    cover: 10813,
    chapters: [
      {
        title: { ja: "読む", en: "Reading" },
        note: {
          ja: "本を読む人は、こちらを見ません。絵の中の沈黙を、そのまま受け取ってください。",
          en: "A reader will not look up. Take the silence of the painting as it is given.",
        },
        works: [13210, 10813, 10468, 437193],
      },
      {
        title: { ja: "集う", en: "Gathering" },
        note: {
          ja: "家族、生徒、客。部屋に人が増えるほど、語られない物語も増えていきます。",
          en: "Family, pupils, guests. The more people in the room, the more stories go unspoken.",
        },
        works: [11263, 438817, 20129, 437070, 626692],
      },
      {
        title: { ja: "窓辺", en: "By the Window" },
        note: {
          ja: "窓は、室内にいる私たちに外の気配を教えます。光の向きが、時刻を告げます。",
          en: "A window tells those inside that there is an outside. The direction of the light tells the hour.",
        },
        works: [436947, 436579, 437881, 435771],
      },
      {
        title: { ja: "手しごと", en: "Hands at Work" },
        note: {
          ja: "金を打つ手、糸を紡ぐ手、子を抱く手。部屋の静けさは、働く手によって保たれています。",
          en: "Hands beating gold, hands spinning thread, hands holding a child. The quiet of a room is kept by working hands.",
        },
        works: [459052, 437915, 437071, 437636],
      },
    ],
  },
  {
    id: "small-worlds",
    title: { ja: "静物という小宇宙", en: "Still Life, a Small Cosmos" },
    subtitle: { ja: "動かないものの物語", en: "The story of things that do not move" },
    curator: {
      ja: "リンゴ、パン、魚、花。動かないものを前に、画家は時間との交渉を始めます。咲いている花は、すでに散りかけています。",
      en: "Apples, bread, fish, flowers. Before things that do not move, the painter begins a negotiation with time. The flower in bloom is already beginning to fall.",
    },
    cover: 435882,
    chapters: [
      {
        title: { ja: "卓上の秩序", en: "Order on a Table" },
        note: {
          ja: "テーブルの上の数センチが、画家にとっては一日の仕事でした。",
          en: "A few centimetres of tabletop was a day's work for these painters.",
        },
        works: [435882, 436946, 436292, 11737, 10997],
      },
      {
        title: { ja: "咲くということ", en: "Being in Bloom" },
        note: {
          ja: "花は、描かれた瞬間から散りはじめます。それが静物画の静かな緊張です。",
          en: "A painted flower begins to fall the moment it is painted. That is the quiet tension of still life.",
        },
        works: [436524, 436528, 10476, 437867, 436634, 436121],
      },
      {
        title: { ja: "狩りのあと", en: "After the Hunt" },
        note: {
          ja: "獲物は、もう動きません。だからこそ画家は、羽毛の一枚まで描き込めます。",
          en: "The quarry no longer moves. That is exactly why a painter can describe every single feather.",
        },
        works: [437238, 437937, 436805],
      },
      {
        title: { ja: "うつろい", en: "Passing" },
        note: {
          ja: "頭蓋骨、砂時計、消えかけの蝋燭。静物画はときどき、時間そのものを描きます。",
          en: "A skull, an hourglass, a guttering candle. Still life sometimes paints time itself.",
        },
        works: [435904, 435918, 438376],
      },
    ],
  },
  {
    id: "faces",
    title: { ja: "顔", en: "Faces" },
    subtitle: { ja: "こちらを見る人々", en: "Those who look back" },
    curator: {
      ja: "肖像画は、四百年前の誰かと、いまのあなたが目を合わせる場所です。額縁の前に立ち、相手がまばたきするのを待ってみてください。",
      en: "A portrait is a place where someone from four hundred years ago meets your eyes. Stand before the frame and wait for them to blink.",
    },
    cover: 437397,
    chapters: [
      {
        title: { ja: "自分を描く", en: "Painting the Self" },
        note: {
          ja: "鏡を見ながら描いた顔は、いちばん正直で、いちばん嘘をつきます。",
          en: "A face painted from a mirror is the most honest and the most deceptive of all.",
        },
        works: [437397, 437394, 436532, 13211],
      },
      {
        title: { ja: "学識と威厳", en: "Learning and Bearing" },
        note: {
          ja: "本、羽毛、毛皮。身につけたものは、その人が何者かを静かに語ります。",
          en: "Books, fur, feather. What a sitter wears says quietly who they are.",
        },
        works: [459080, 436658, 437056, 459082, 435896],
      },
      {
        title: { ja: "笑う人", en: "The Laughing Face" },
        note: {
          ja: "笑顔を描くのは難しい。止まっているのに、動いて見えるからです。",
          en: "A smile is hard to paint: it stands still, and still seems to move.",
        },
        works: [436622, 438112, 436253, 436944, 440723],
      },
      {
        title: { ja: "見つめかえす", en: "Looking Back" },
        note: {
          ja: "描かれた人は、こちらをじっと見ています。先に目をそらすのは、いつも見る側です。",
          en: "The sitter holds your gaze. It is always the viewer who looks away first.",
        },
        works: [437869, 436545, 436106],
      },
    ],
  },
];
