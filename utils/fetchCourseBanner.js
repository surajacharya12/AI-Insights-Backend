import fetch from "node-fetch";

export async function fetchCourseBanner(course) {
    const query = `${course.name} ${course.category} ${course.level} course`;

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
    )}&orientation=landscape&per_page=1`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch banner image");
    }

    const data = await response.json();

    return data.results?.[0]?.urls?.regular || null;
}
