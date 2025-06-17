(function () {
    const allowedDomains = ['laky-saydatii.blogspot.com', 'qanwatlive.com']; // ✏️ عدل إلى مواقعك فقط
    const currentURL = window.location.href;
    const referrerURL = document.referrer;

    const isAllowed = allowedDomains.some(domain =>
        currentURL.includes(domain) || referrerURL.includes(domain)
    );

    if (!isAllowed) {
        console.error('غير مصرح لك باستخدام هذا المصدر');
        return;
    }

    // ✅ الدالة الرئيسية للاستدعاء من الخارج
    window.getEPGData = async function (callback) {
        const allEpgData = [];
        const maxPages = 3;

        try {
            for (let page = 1; page <= maxPages; page++) {
                const proxyUrl = 'https://api.allorigins.win/raw?url=';
                const targetUrl = `https://elcinema.com/tvsummary/now/?page=${page}`;
                const response = await fetch(proxyUrl + targetUrl);

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status} for page ${page}`);
                }

                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                doc.querySelectorAll('li').forEach(element => {
                    const thumbnailWrapper = element.querySelector(':scope > .thumbnail-wrapper');
                    if (!thumbnailWrapper) return;

                    let imageHtml = thumbnailWrapper.innerHTML.replace(/data-src/g, 'src').replace(/<a[^>]*>(.*?)<\/a>/g, '$1');
                    let showPoster = '';
                    if (imageHtml) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = imageHtml;
                        const imgTag = tempDiv.querySelector('img');
                        if (imgTag) {
                            let src = imgTag.getAttribute('src') || '';
                            showPoster = src.startsWith('/') ? 'https://media0078.elcinema.com' + src : src;
                        }
                    }

                    const unstyled = element.querySelector('ul.unstyled');
                    let showName = 'N/A';
                    let channelName = 'N/A';
                    let showTime = 'N/A';
                    if (unstyled) {
                        const lis = unstyled.querySelectorAll('li');
                        if (lis.length > 0) {
                            const showNameA = lis[0].querySelector('a');
                            if (showNameA) showName = showNameA.textContent.trim();
                        }
                        if (lis.length > 1) {
                            const channelLinks = lis[1].querySelectorAll('a');
                            if (channelLinks.length > 1) {
                                channelName = channelLinks[1].textContent.trim();
                            } else if (channelLinks.length === 1) {
                                channelName = channelLinks[0].textContent.trim();
                            }
                        }
                        if (lis.length > 0) {
                            showTime = lis[lis.length - 1].textContent.trim();
                        }
                    }

                    allEpgData.push({
                        showName,
                        channelName,
                        showTime,
                        showPoster
                    });
                });
            }

            if (typeof callback === 'function') {
                callback(allEpgData);
            } else {
                console.log(allEpgData); // في حالة عدم وجود كولباك
            }

        } catch (error) {
            console.error('فشل تحميل بيانات EPG:', error.message);
        }
    };
})();
