import { Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
export const Tagline = ({ label, route = '/' }: { label: string, route?: string }) => {
  const router = useRouter();
  return (<Text onClick={() => router.push(route)} as="h1" fontSize="sm" color="gray.600" pos={"absolute"} right="5" top="0">{label}</Text>);
}