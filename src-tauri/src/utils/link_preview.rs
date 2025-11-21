use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkMetadata {
    pub url: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub image: Option<String>,
    pub favicon: Option<String>,
    pub site_name: Option<String>,
}

/// Fetch link metadata from a URL
pub async fn fetch_link_metadata(url: &str) -> Result<LinkMetadata, String> {
    // Validate URL
    let url_obj = url::Url::parse(url).map_err(|e| format!("Invalid URL: {}", e))?;

    // Only allow HTTP(S) URLs for security
    if url_obj.scheme() != "http" && url_obj.scheme() != "https" {
        return Err("Only HTTP(S) URLs are supported".to_string());
    }

    // Create HTTP client with timeout
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .user_agent("Mozilla/5.0 (compatible; HoegoBot/1.0)")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Fetch HTML
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch URL: {}", e))?;

    // Check if response is successful
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    // Get HTML content
    let html = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    // Parse HTML and extract metadata
    let metadata = parse_html_metadata(&html, url)?;

    Ok(metadata)
}

/// Parse HTML and extract Open Graph / meta tags
fn parse_html_metadata(html: &str, url: &str) -> Result<LinkMetadata, String> {
    use scraper::{Html, Selector};

    let document = Html::parse_document(html);
    let url_obj = url::Url::parse(url).map_err(|e| format!("Invalid URL: {}", e))?;

    let mut metadata = LinkMetadata {
        url: url.to_string(),
        title: None,
        description: None,
        image: None,
        favicon: None,
        site_name: None,
    };

    // Helper function to get meta content
    let get_meta_content = |property: &str| -> Option<String> {
        let og_selector = Selector::parse(&format!("meta[property='{}']", property)).ok()?;
        let name_selector = Selector::parse(&format!("meta[name='{}']", property)).ok()?;

        document
            .select(&og_selector)
            .next()
            .or_else(|| document.select(&name_selector).next())
            .and_then(|el| el.value().attr("content"))
            .map(|s| s.to_string())
    };

    // Extract Open Graph data
    metadata.title = get_meta_content("og:title")
        .or_else(|| get_meta_content("twitter:title"))
        .or_else(|| {
            // Fallback to <title> tag
            let title_selector = Selector::parse("title").ok()?;
            document
                .select(&title_selector)
                .next()
                .map(|el| el.inner_html())
        });

    metadata.description = get_meta_content("og:description")
        .or_else(|| get_meta_content("twitter:description"))
        .or_else(|| get_meta_content("description"));

    metadata.image = get_meta_content("og:image")
        .or_else(|| get_meta_content("twitter:image"))
        .and_then(|img_url| resolve_url(&url_obj, &img_url));

    metadata.site_name = get_meta_content("og:site_name").or_else(|| Some(url_obj.host_str()?.to_string()));

    // Extract favicon
    metadata.favicon = extract_favicon(&document, &url_obj);

    Ok(metadata)
}

/// Extract favicon from HTML
fn extract_favicon(document: &scraper::Html, url: &url::Url) -> Option<String> {
    use scraper::Selector;

    // Try various favicon selectors
    let selectors = [
        "link[rel='icon']",
        "link[rel='shortcut icon']",
        "link[rel='apple-touch-icon']",
    ];

    for selector_str in &selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(link) = document.select(&selector).next() {
                if let Some(href) = link.value().attr("href") {
                    if let Some(resolved) = resolve_url(url, href) {
                        return Some(resolved);
                    }
                }
            }
        }
    }

    // Fallback to default favicon.ico
    let mut favicon_url = url.clone();
    favicon_url.set_path("/favicon.ico");
    Some(favicon_url.to_string())
}

/// Resolve relative URL to absolute URL
fn resolve_url(base: &url::Url, relative: &str) -> Option<String> {
    base.join(relative).ok().map(|u| u.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_url() {
        let base = url::Url::parse("https://example.com/page").unwrap();
        assert_eq!(
            resolve_url(&base, "/image.png"),
            Some("https://example.com/image.png".to_string())
        );
        assert_eq!(
            resolve_url(&base, "https://other.com/image.png"),
            Some("https://other.com/image.png".to_string())
        );
    }
}
