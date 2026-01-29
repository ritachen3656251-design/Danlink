import React from 'react';

const MarketplaceScreen = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-[#0d121b] dark:text-[#f8f9fc] overflow-x-hidden pb-24 min-h-screen">
      <header className="sticky top-0 z-40 w-full bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md pt-4 pb-2 px-4 border-b border-transparent transition-all">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black tracking-tight text-primary dark:text-blue-400">旦Link集市</h1>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-[#4c669a] dark:text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
          </div>
        </div>
        <label className="flex flex-col w-full h-12 shadow-sm">
          <div className="flex w-full flex-1 items-stretch rounded-full h-full bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <div className="text-[#4c669a] flex items-center justify-center pl-4 pr-2">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input className="flex w-full min-w-0 flex-1 bg-transparent border-none text-[#0d121b] dark:text-white placeholder:text-[#9aa2b1] focus:ring-0 text-sm font-medium leading-normal h-full rounded-full" placeholder="搜索课本、电子产品..." />
            <div className="flex items-center justify-center pr-1">
              <button className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-[#4c669a]">
                <span className="material-symbols-outlined text-[20px]">tune</span>
              </button>
            </div>
          </div>
        </label>
      </header>

      <main className="flex flex-col gap-6 pt-4">
        <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar items-center">
          <button className="flex h-9 shrink-0 items-center justify-center rounded-full bg-[#0d121b] text-white px-5 shadow-md">
            <span className="text-sm font-semibold">全部</span>
          </button>
          {['课本', '电子产品', '宿舍生活', '运动器材'].map(cat => (
            <button key={cat} className="flex h-9 shrink-0 items-center justify-center rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-[#0d121b] dark:text-white px-5">
              <span className="text-sm font-medium">{cat}</span>
            </button>
          ))}
        </div>

        <div className="px-4">
          <div className="columns-2 gap-4 space-y-4">
            {/* Item 1 */}
            <div className="break-inside-avoid relative flex flex-col gap-3 rounded-2xl bg-white dark:bg-surface-dark p-2 pb-3 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="relative group">
                <div className="w-full aspect-[3/4] rounded-xl bg-gray-200 bg-cover bg-center overflow-hidden" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCBxICFewSE82q5RzXCmlEkDHC7OOC6TIR-5ztcUngt-11UHXxJU867lAaQ5MtuJIUG8LiVGgH9ZZZXBVoq0QSlo3gaVl6qah2t5d8q9bmHBFL03o6oLhMmal-xyYFzZjPPiYzjvBu8MGqiC2chqYLmWPva5uiUaYYj854XUNJvtj9HXs5r1_RIOozlRmN2TrO-aEnmdA96bWxdCMEFr6evJE03qXiMOxgTmO2UvsTzkH4efFHuAS9bI2scHOJVFs9CGiazooxb5qgq')" }}>
                   <div className="absolute bottom-2 right-2 opacity-40 bg-black/20 backdrop-blur-[2px] px-1.5 py-0.5 rounded text-[8px] text-white font-bold tracking-widest uppercase">Fudan</div>
                </div>
                <div className="absolute -bottom-3 left-3 flex items-center">
                  <div className="relative h-8 w-8 rounded-full border-2 border-white dark:border-surface-dark bg-gray-100 overflow-hidden" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC9tQGN30jh426nHRwBJS5qE8ibGN5ArEtGg6AGL09UXY5yN5DQ-1nYW3nuJbRRN8CPfC2V208qTxBi1JxcKlUhENdMJSdLD9cQAOxsw8XwP2Ikpfj-tKSWp_R9qyQameQZo7sVt8XwsUduJzTfRcRjVrJYr5KwoIJNVljHuYuve-7PZR5VbBjkefFMGKH_IPxGeYyy9QJT9myyjWlb3bQgFSkeXw7MGcttpgvTJNkIcQhYFyWQ4CkfgBcJVecosLKm_aaToBEpZ-rC')", backgroundSize: 'cover' }}></div>
                  <div className="flex items-center justify-center h-4 w-4 -ml-1.5 mt-4 rounded-full bg-white dark:bg-surface-dark shadow-sm z-10">
                    <span className="material-symbols-outlined text-[14px] text-amber-400" title="Gold Ginkgo">spa</span>
                  </div>
                </div>
              </div>
              <div className="px-1 mt-2">
                <h3 className="text-[#0d121b] dark:text-white text-sm font-semibold leading-tight line-clamp-2">小米电动滑板车</h3>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-primary font-bold text-base">¥300</p>
                  <p className="text-[10px] text-gray-400">北区宿舍</p>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="break-inside-avoid relative flex flex-col gap-3 rounded-2xl bg-white dark:bg-surface-dark p-2 pb-3 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="relative group">
                <div className="w-full aspect-[4/5] rounded-xl bg-gray-200 bg-cover bg-center overflow-hidden" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAnZ1z1ZUWE9Oez4W7Zbrc6b-vmXMQ7AQin0XWQ8jKS5eEoF36P_7KZPlLpGdq9MU15ykyr98HlnVBmgwQIp2jN7Pu_h5eKifi_p6YKFCEZ_YOO1hA1ZYSqalXtQwUC3v_sXM-eWqcnyS-TCDXY10e4Fi3oIaah9a-KLgSTdVYIxRTu95jscuMnyyBlw-1Oqf7ef9mBLxaNX7ekKlGjuTYhubi3stieHtYEAQQ-WYscD9dRJldOafkEAen1kXeIGOroKoiCmXAhJiuV')" }}>
                  <div className="absolute bottom-2 right-2 opacity-40 bg-black/20 backdrop-blur-[2px] px-1.5 py-0.5 rounded text-[8px] text-white font-bold tracking-widest uppercase">Fudan</div>
                </div>
                <div className="absolute -bottom-3 left-3 flex items-center">
                  <div className="relative h-8 w-8 rounded-full border-2 border-white dark:border-surface-dark bg-gray-100 overflow-hidden" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBhZcf6NRzzIyq83qtBHzmZTabRTzw_kLYoBOgiSLyF84fPNuJ6pAJpt-y1Dy7-r3Knf4GJLhLGk5YZipjlqlT3EUv_YXu7qYM0lwRLaOyg-X6-n3QMCA1jDC7ARIekesgaBqJKV53_DAYk4__KB2ChHp9hEJkMiW25InCIZGv8FQ3cf3cVa6UHi_F8n_Hn-G5yH1zVE_6mqOj4tARwhe2IkygCw-XEQXk8-sq8nJjHYAdRsWNNGnfyhfuJvsxAHBNlc06X7igYMUZI')", backgroundSize: 'cover' }}></div>
                  <div className="flex items-center justify-center h-4 w-4 -ml-1.5 mt-4 rounded-full bg-white dark:bg-surface-dark shadow-sm z-10">
                    <span className="material-symbols-outlined text-[14px] text-gray-400" title="Silver Ginkgo">spa</span>
                  </div>
                </div>
              </div>
              <div className="px-1 mt-2">
                <h3 className="text-[#0d121b] dark:text-white text-sm font-semibold leading-tight">微积分下册</h3>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-primary font-bold text-base">¥45</p>
                  <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-300">九成新</span>
                </div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="break-inside-avoid relative flex flex-col gap-3 rounded-2xl bg-white dark:bg-surface-dark p-2 pb-3 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="relative group">
                <div className="w-full aspect-square rounded-xl bg-gray-200 bg-cover bg-center overflow-hidden" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBFm79vf5839sz9JoAp68KiY5GwjZaIKlGN1__2btR-xGQ-oIu4ji-L5ONHGxPiegCll20cENzPSIAdON-3LavHUg9184wMUbDFOn9JAoiVFeiQvYRnwHBwmBukslY_hOd7X0JGusqHtyNX8i-r1Smw0PiyRR9sjKRGjiaPeAhZ5pB3a7JRj23A530RbEMBvZYgyLSfzSCpm7R5qStiWCnSyd6O99Rzgw0AQIylFX4KlJj6rVzt6LOw-rQVQV5nEVYZ0lIKraBC4cMO')" }}>
                   <div className="absolute bottom-2 right-2 opacity-40 bg-black/20 backdrop-blur-[2px] px-1.5 py-0.5 rounded text-[8px] text-white font-bold tracking-widest uppercase">Fudan</div>
                </div>
                <div className="absolute -bottom-3 left-3 flex items-center">
                  <div className="relative h-8 w-8 rounded-full border-2 border-white dark:border-surface-dark bg-gray-100 overflow-hidden" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBG-WYFOIaJw-QEtD88tbf7ioHND9JbPlH6PBgSJrDSQpJ_v2ogjQ4L-csQTI15pOwOF6zsTO7-WdqPKhfhIxnvCN1UPmBCv7n-ghwwTCzP1eaz9zMyDIL5neTSu5vZ3fD3uzh1uF8drk7kk70_S6fSgCZIbKmSp4C9svsPZh8m7jUwRJksoYi9D1oAgnPYSAZroAmbLolj8fA0w7UTRlJU6MMK_d4NGlSs6OW5dymvjYY0B4JVtXDX9bKhslxVnszyMS-WOCs7Y_UH')", backgroundSize: 'cover' }}></div>
                  <div className="flex items-center justify-center h-4 w-4 -ml-1.5 mt-4 rounded-full bg-white dark:bg-surface-dark shadow-sm z-10">
                     <span className="material-symbols-outlined text-[14px] text-amber-700" title="Bronze Ginkgo">spa</span>
                  </div>
                </div>
              </div>
              <div className="px-1 mt-2">
                <h3 className="text-[#0d121b] dark:text-white text-sm font-semibold leading-tight">宿舍台灯</h3>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-primary font-bold text-base">¥35</p>
                  <p className="text-[10px] text-gray-400">东门取</p>
                </div>
              </div>
            </div>

            {/* Item 4 */}
            <div className="break-inside-avoid relative flex flex-col gap-3 rounded-2xl bg-white dark:bg-surface-dark p-2 pb-3 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="relative group">
                <div className="w-full aspect-[2/3] rounded-xl bg-gray-200 bg-cover bg-center overflow-hidden" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC8BtkLgXyPf_Gs4ZimAIb5zjs9BRxn_z95AFdCZ958wufWrX64EbN41-J7VklquNpPJAAdBJZtsODaW_OkW0nqLOqCRoqQikC8Y_BTyop0LWmAKESySDj6AojhEKqxC1WmqToYtnRllakJEoBdLW9-6UmVXkSjXKHdBJ4CLuBkZGstwKzbE45f7qUg9VNIr2xv_circEptC2y7uLU2iqwx3Ng4kG7RcG-juhgxs3qJbMcoiJENViQwXIFprGP8TBjCR8sRW73LmCPJ')" }}>
                  <div className="absolute bottom-2 right-2 opacity-40 bg-black/20 backdrop-blur-[2px] px-1.5 py-0.5 rounded text-[8px] text-white font-bold tracking-widest uppercase">Fudan</div>
                </div>
                <div className="absolute -bottom-3 left-3 flex items-center">
                  <div className="relative h-8 w-8 rounded-full border-2 border-white dark:border-surface-dark bg-gray-100 overflow-hidden" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDd0TP_YCNMPqzg1l6yS5YaaKuM2P3f-v-mJ1AT0A0gzFgcTKUizGuphFTTegEINYdM83J02YE5Wr_2glT3go_hlDL6-fIbitljkrtB-rltl_S6c91wDAeBj57XwEPcJtc9VCXk8AgsZ0Az_fF0EhvzUdj4AednXGy3O_foaMQWZ0PhCryBTJUNrjaQn783HLGiHQPlHHWiytCEFH3rPDDP2lgjPWO_6OFgxCMOxDkoOQNE5bsXCUqPpP7fFQHlew1KlGCVoCxSKBR0')", backgroundSize: 'cover' }}></div>
                </div>
              </div>
              <div className="px-1 mt-2">
                <h3 className="text-[#0d121b] dark:text-white text-sm font-semibold leading-tight">全身镜</h3>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-primary font-bold text-base">¥20</p>
                  <p className="text-[10px] text-gray-400">图书馆</p>
                </div>
              </div>
            </div>

            {/* Item 5 */}
            <div className="break-inside-avoid relative flex flex-col gap-3 rounded-2xl bg-white dark:bg-surface-dark p-2 pb-3 shadow-sm border border-gray-100 dark:border-gray-800">
               <div className="relative group">
                 <div className="w-full aspect-square rounded-xl bg-gray-200 bg-cover bg-center overflow-hidden" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDPjlCpL1DHcwsQxEfxc8zlJxMFSPKVkMnYb8pAEGE_G9LZ2oENQnTTuy6MZOSb4eXmu57Ftlgc8jcHqzZBlndvilzamfhaToc8m9A5iNd1jpWlwczFT68BWFvwpk-YmBclwPFJ_E3YndKt8vh4l9wApttMAj-fhO-lIFmpHBpVw_rPz0SjNXviPHUjQidLhHY3_48qqMmTlN2o9KnJFaae8KwxCdAwLzkqSjy6upbN8r4vcU08fBa55_41eKM6qg9wWLSXwosJ_dQR')" }}>
                   <div className="absolute bottom-2 right-2 opacity-40 bg-black/20 backdrop-blur-[2px] px-1.5 py-0.5 rounded text-[8px] text-white font-bold tracking-widest uppercase">Fudan</div>
                 </div>
                 <div className="absolute -bottom-3 left-3 flex items-center">
                    <div className="relative h-8 w-8 rounded-full border-2 border-white dark:border-surface-dark bg-gray-100 overflow-hidden" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBtwBlvSQ0fDVi7REKj4gdFfPsBoTEIfYedBxd6VadjIjzIuXzA_BUfEgImwcTd345emNG-QP7350uDvEgkNciW7HquuQl2cSbtpi59pPmUAjs_IMoQ2feAjRWMHmcb74h0ly3E25xhQMQfWGVeRNz9y5duUEUB9nQZ8T-gOEdCkx9HEL-R8WXvB-JK_y9OKWSpibvdxGb4SB-1uxTbXPAczsiPPDMBExDRmRagcCPQSh3lEIkfKS_arjLgm_bdXNHKBiwZAzM9Z3Dl')", backgroundSize: 'cover' }}></div>
                    <div className="flex items-center justify-center h-4 w-4 -ml-1.5 mt-4 rounded-full bg-white dark:bg-surface-dark shadow-sm z-10">
                       <span className="material-symbols-outlined text-[14px] text-amber-400" title="Gold Ginkgo">spa</span>
                    </div>
                 </div>
               </div>
               <div className="px-1 mt-2">
                 <h3 className="text-[#0d121b] dark:text-white text-sm font-semibold leading-tight">索尼耳机</h3>
                 <div className="flex items-center justify-between mt-1.5">
                   <p className="text-primary font-bold text-base">¥850</p>
                   <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300">正品</span>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </main>
      
      <div className="fixed bottom-24 right-4 z-40">
        <button className="h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
          <span className="material-symbols-outlined text-[32px]">add</span>
        </button>
      </div>
    </div>
  );
};

export default MarketplaceScreen;