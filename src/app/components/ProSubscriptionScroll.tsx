import { ContainerTextScroll } from "./ui/container-text-scroll";

export function ProSubscriptionScroll() {
  return (
    <div className="flex flex-col overflow-hidden pb-[100px] mb-24">
      <ContainerTextScroll
        titleComponent={
          <>
            <h2 className="text-4xl md:text-5xl font-semibold text-white">
              Experience the match like a manager. <br />
              <span className="text-6xl md:text-[6rem] font-black font-outfit mt-4 leading-none text-[#16A34A] block">
                The Touchline Dribble Pro
              </span>
            </h2>
          </>
        }
      >
        <img
          src="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=3840&auto=format&fit=crop"
          alt="Stadium Tactics Dashboard"
          className="mx-auto block object-cover h-full w-full object-center scale-105"
          draggable={false}
        />
      </ContainerTextScroll>
    </div>
  );
}
