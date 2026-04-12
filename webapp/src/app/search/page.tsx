import {
  SearchPageContent,
  getSearchPageData,
  type SearchPageDataParams,
} from "@/components/shared/search-page/index";

export default async function SearchPage(props: SearchPageDataParams) {
  const data = await getSearchPageData(props);
  return <SearchPageContent {...data} />;
}
